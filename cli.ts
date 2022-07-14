#!/usr/bin/env node
import sanitize from "sanitize-filename";
import ffmpeg from "ffmpeg-static";
import logUpdate from "log-update";
import cp from "child_process";
import ytdl from "ytdl-core";
import path from "path";

function formatBytes(bytes: number) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

const OUT_DIR =
	process.platform === "win32"
		? path.join(process.env.USERPROFILE as string, "Downloads")
		: (process.env.HOME as string);

export async function downloadVideo(
	url: string,
	out: string | null,
	format: string | null
) {
	const info = await ytdl.getInfo(url);

	const outputFormatIsValid = validate(format as string, [
		"mp4",
		"mkv",
		"mov",
		"wmv",
		"webm",
		"avi",
	]);

	console.log(`Downloading "${info.videoDetails.title}"`);

	const FFMPEG_ARGS = [
		"-loglevel",
		"8",
		"-hide_banner",
		"-progress",
		"pipe:3",
		"-i",
		"pipe:4",
		"-i",
		"pipe:5",
		"-map",
		"0:a",
		"-map",
		"1:v",
		"-c:v",
		"copy",
		path.join(
			out !== null ? out : OUT_DIR,
			`${sanitize(info.videoDetails.title)}.${
				outputFormatIsValid ? format : "mp4"
			}`
		),
	];

	const tracker = {
		audio: { downloaded: 0, total: Infinity },
		video: { downloaded: 0, total: Infinity },
	};

	const audio = ytdl(url, { quality: "highestaudio" }).on(
		"progress",
		(_, downloaded, total) => {
			tracker.audio = { downloaded, total };
		}
	);

	const video = ytdl(url, { quality: "highestvideo" }).on(
		"progress",
		(_, downloaded, total) => {
			tracker.video = { downloaded, total };
		}
	);

	const ffmpegProcess = cp.spawn(ffmpeg, FFMPEG_ARGS, {
		windowsHide: true,
		stdio: ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"],
	});

	ffmpegProcess.on("close", () => {
		logUpdate("Done!");
	});

	ffmpegProcess.stdio[3]?.on("data", () => {
		const total = {
			downloaded: tracker.audio.downloaded + tracker.video.downloaded,
			total: tracker.audio.total + tracker.video.total,
		};

		logUpdate(`Audio: ${formatBytes(
			tracker.audio.downloaded
		)}/${formatBytes(tracker.audio.total)}
Video: ${formatBytes(tracker.video.downloaded)}/${formatBytes(
			tracker.video.total
		)}
Total: ${formatBytes(total.downloaded)}/${formatBytes(total.total)}`);
	});

	// @ts-ignore
	audio.pipe(ffmpegProcess.stdio[4]);
	// @ts-ignore
	video.pipe(ffmpegProcess.stdio[5]);
}

export async function downloadAudio(
	url: string,
	out: string | null,
	format: string | null
) {
	const info = await ytdl.getInfo(url);
	const tracker = { downloaded: 0, total: Infinity };

	console.log(`Downloading "${info.videoDetails.title}"`);

	const outputFormatIsValid = validate(format as string, [
		"mp3",
		"ogg",
		"wav",
		"aac",
		"webm",
		"wma",
	]);

	const audio = ytdl(url, { quality: "highestaudio" }).on(
		"progress",
		(_, downloaded, total) => {
			tracker.downloaded = downloaded;
			tracker.total = total;
		}
	);

	const FFMPEG_ARGS = [
		"-loglevel",
		"8",
		"-hide_banner",
		"-progress",
		"pipe:3",
		"-i",
		"pipe:4",
		path.join(
			out !== null ? out : OUT_DIR,
			`${sanitize(info.videoDetails.title)}.${
				outputFormatIsValid ? format : "mp3"
			}`
		),
	];

	const ffmpegProcess = cp.spawn(ffmpeg, FFMPEG_ARGS, {
		windowsHide: true,
		stdio: ["inherit", "inherit", "inherit", "pipe", "pipe"],
	});

	ffmpegProcess.stdio[3]?.on("data", () => {
		logUpdate(
			`Audio: ${formatBytes(tracker.downloaded)}/${formatBytes(
				tracker.total
			)}`
		);
	});

	ffmpegProcess.stdio[3]?.on("close", () => {
		logUpdate("Done!");
	});

	// @ts-ignore
	audio.pipe(ffmpegProcess.stdio[4]);
}

export async function getVideoInfo(url: string) {
	const info = await ytdl.getInfo(url);

	const result = `Title: "${info.videoDetails.title}"
Made By: "${info.videoDetails.author.name}"
Published: "${info.videoDetails.publishDate.split(/-/g).reverse().join("/")}"
Uploaded: "${info.videoDetails.uploadDate.split(/-/g).reverse().join("/")}"
URL: ${url}`;

	console.log(result);

	return info;
}

function validate(str: string, valid: string[]) {
	if (!valid.includes(str)) {
		return false;
	}
	return true;
}

function getArgument(args: string[], name1: string, name2: string) {
	function _getArgument(name: string) {
		return args.includes(name) ? args[args.indexOf(name) + 1] : null;
	}

	return _getArgument(name1) || _getArgument(name2) || null;
}

const help = () => {
	console.log(`Usage:
ytdl -h | --help -> Show this help message
ytdl -v | --version -> Show the version of ytdl
ytdl -i | --info <url> -> Get the info of the video specified
ytdl -da | --download-audio <url> [options] -> Download the audio of the url
ytdl -dv | --download-video <url> [options] -> Download the video of the url

Options:
-o <directory> -> Sets The Output Directory - Default Is "%USERPROFILE%\\Downloads"
-f <mp3|wav|ogg|aac|wma|mp4|mkv|mov|webm|wmv|avi> -> Sets The Output File Format - Default Is mp3 For Audio And mp4 For Video`);
};

(async () => {
	const [, , mode, url, ...args] = process.argv;

	const VERSION = "1.2.2";

	const output = getArgument(args, "-o", "--output");
	const format = getArgument(args, "-f", "--format");

	if (mode === "-h" || mode === "--help") {
		help();
		process.exit(0);
	} else if (mode === "-v" || mode === "--version") {
		console.log(`ytdl version ${VERSION}`);
		process.exit(0);
	} else if (mode === "-dv" || mode === "--download-video") {
		downloadVideo(url, output, format);
	} else if (mode === "-da" || mode === "--download-audio") {
		downloadAudio(url, output, format);
	} else if (mode === "-i" || mode === "--info") {
		getVideoInfo(url);
	} else {
		console.log("Error: Unknown mode");
		help();
		process.exit(1);
	}
})();

import { Behavior } from "./Behaviour.js";

export class TextBehavior extends Behavior {
	measure(node, constraints, ctx) {
		const text = String(node.text ?? "");
		const style = node.style ?? {};
		const font = style.font ?? "14px sans-serif";

		const maxWidth = Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity;
		const maxHeight = Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity;

		const intrinsic = measureIntrinsicText(text, font, ctx);
		const paddingX = toFinite(style.paddingX, 0)
			+ toFinite(style.paddingLeft, 0)
			+ toFinite(style.paddingRight, 0);
		const paddingY = toFinite(style.paddingY, 0)
			+ toFinite(style.paddingTop, 0)
			+ toFinite(style.paddingBottom, 0);

		const minWidth = toFinite(style.minWidth, 0);
		const minHeight = toFinite(style.minHeight, 0);
		const preferredWidth = toFinite(style.width, intrinsic.width + paddingX);
		const preferredHeight = toFinite(style.height, intrinsic.height + paddingY);

		const width = clamp(preferredWidth, minWidth, maxWidth);
		const height = clamp(preferredHeight, minHeight, maxHeight);

		return {
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		};
	}

	update(node, dt, ctx) {
		// Text leaf has no autonomous update loop by default.
	}

	render(node, ctx) {
		const { x, y, width, height } = node.bounds;
		const style = node.style ?? {};

		if (style.background) {
			ctx.fillStyle = style.background;
			ctx.fillRect(x, y, width, height);
		}

		if (style.borderColor && (style.borderWidth ?? 0) > 0) {
			ctx.lineWidth = style.borderWidth ?? 1;
			ctx.strokeStyle = style.borderColor;
			ctx.strokeRect(x, y, width, height);
		}

		ctx.fillStyle = style.color ?? "#FFFFFF";
		ctx.font = style.font ?? "14px sans-serif";
		ctx.textAlign = style.textAlign ?? "left";
		ctx.textBaseline = style.textBaseline ?? "middle";

		const paddingLeft = toFinite(style.paddingLeft, 0) + toFinite(style.paddingX, 0);
		const paddingRight = toFinite(style.paddingRight, 0) + toFinite(style.paddingX, 0);
		const paddingTop = toFinite(style.paddingTop, 0) + toFinite(style.paddingY, 0);
		const paddingBottom = toFinite(style.paddingBottom, 0) + toFinite(style.paddingY, 0);

		const contentX = x + paddingLeft;
		const contentY = y + paddingTop;
		const contentWidth = Math.max(0, width - paddingLeft - paddingRight);
		const contentHeight = Math.max(0, height - paddingTop - paddingBottom);

		const textX = resolveTextX(contentX, contentWidth, style.textAlign);
		const textY = resolveTextY(contentY, contentHeight, style.textBaseline);

		ctx.fillText(String(node.text ?? ""), textX, textY);
	}
}

function measureIntrinsicText(text, font, ctx) {
	if (!ctx) {
		const fontSize = parseFontSize(font);
		return {
			width: text.length * Math.max(6, fontSize * 0.55),
			height: fontSize * 1.2
		};
	}

	ctx.save();
	ctx.font = font;
	const metrics = ctx.measureText(text);
	ctx.restore();

	const fontSize = parseFontSize(font);
	const measuredHeight = (metrics.actualBoundingBoxAscent ?? fontSize * 0.8)
		+ (metrics.actualBoundingBoxDescent ?? fontSize * 0.2);

	return {
		width: metrics.width,
		height: measuredHeight
	};
}

function parseFontSize(font) {
	const match = String(font).match(/(\d+(?:\.\d+)?)px/);
	return match ? Number(match[1]) : 14;
}

function toFinite(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function resolveTextX(x, width, align = "left") {
	if (align === "center") {
		return x + width / 2;
	}

	if (align === "right" || align === "end") {
		return x + width;
	}

	return x;
}

function resolveTextY(y, height, baseline = "middle") {
	if (baseline === "top" || baseline === "hanging") {
		return y;
	}

	if (baseline === "bottom" || baseline === "ideographic") {
		return y + height;
	}

	return y + height / 2;
}

import { Behavior } from "./Behaviour.js";
import { measureIntrinsicText, resolveContentRect, resolvePadding } from "./textBoxHelpers.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";
import { TextLayoutCalculator } from "../../utils/textLayoutCalculator.js";

export class TextBehavior extends Behavior {
	measure(node, constraints, ctx) {
		const text = String(node.text ?? "");
		const style = node.style ?? {};
		const font = style.font ?? "14px sans-serif";
		const wrap = Boolean(style.wrap || style.multiline);
		const lineGap = this.toFinite(style.lineGap, 2);

		const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);

		const intrinsic = measureIntrinsicText(text, font, ctx);
		const paddingX = this.toFinite(style.paddingX, 0)
			+ this.toFinite(style.paddingLeft, 0)
			+ this.toFinite(style.paddingRight, 0);
		const paddingY = this.toFinite(style.paddingY, 0)
			+ this.toFinite(style.paddingTop, 0)
			+ this.toFinite(style.paddingBottom, 0);

		const minWidth = this.toFinite(style.minWidth, 0);
		const minHeight = this.toFinite(style.minHeight, 0);
		const preferredWidth = this.toFinite(style.width, intrinsic.width + paddingX);

		const width = this.clamp(preferredWidth, minWidth, maxWidth);

		let intrinsicHeight = intrinsic.height;
		if (wrap) {
			const contentWidth = Math.max(0, width - paddingX);
			const layout = TextLayoutCalculator.calculateLayout(text, ctx, contentWidth, font);
			intrinsicHeight = calculateTotalTextHeight(layout, lineGap);
		}

		const preferredHeight = this.toFinite(style.height, intrinsicHeight + paddingY);
		const height = this.clamp(preferredHeight, minHeight, maxHeight);

		return {
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		};
	}

	update(node, dt, ctx) {
		// Text leaf has no autonomous update loop by default.
	}

	render(node, ctx) {
		const style = node.style ?? {};
		const wrap = Boolean(style.wrap || style.multiline);
		const lineGap = this.toFinite(style.lineGap, 2);
		const padding = resolvePadding(style, this.toFinite.bind(this));
		const content = resolveContentRect(node.bounds, node.layout, padding);

		renderBoxBackground(ctx, node.bounds, style);
		renderBoxBorder(ctx, node.bounds, style, { borderColor: style.borderColor });

		ctx.fillStyle = style.color ?? "#FFFFFF";
		ctx.font = style.font ?? "14px sans-serif";
		ctx.textAlign = style.textAlign ?? "left";
		ctx.textBaseline = wrap ? "top" : (style.textBaseline ?? "middle");

		if (!wrap) {
			const textX = resolveTextX(content.contentX, content.contentWidth, style.textAlign);
			const textY = resolveTextY(content.contentY, content.contentHeight, style.textBaseline);
			ctx.fillText(String(node.text ?? ""), textX, textY);
			return;
		}

		const layout = TextLayoutCalculator.calculateLayout(
			String(node.text ?? ""),
			ctx,
			content.contentWidth,
			ctx.font
		);

		ctx.save();
		ctx.beginPath();
		ctx.rect(content.contentX, content.contentY, content.contentWidth, content.contentHeight);
		ctx.clip();

		for (let index = 0; index < layout.lines.length; index++) {
			const line = layout.lines[index];
			const lineY = content.contentY + index * (layout.lineHeight + lineGap);
			ctx.fillText(line.text, content.contentX, lineY);
		}

		ctx.restore();
	}
}

function calculateTotalTextHeight(layout, lineGap) {
	const lineCount = layout?.lines?.length ?? 0;
	if (lineCount <= 0) {
		return 0;
	}

	return (layout.lineHeight * lineCount) + (lineGap * Math.max(0, lineCount - 1));
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

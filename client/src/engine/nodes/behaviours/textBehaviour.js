import { Behavior } from "./Behaviour.js";
import { measureIntrinsicText, resolveContentRect, resolvePadding } from "./textBoxHelpers.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";

export class TextBehavior extends Behavior {
	measure(node, constraints, ctx) {
		const text = String(node.text ?? "");
		const style = node.style ?? {};
		const font = style.font ?? "14px sans-serif";

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
		const preferredHeight = this.toFinite(style.height, intrinsic.height + paddingY);

		const width = this.clamp(preferredWidth, minWidth, maxWidth);
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
		const padding = resolvePadding(style, this.toFinite.bind(this));
		const content = resolveContentRect(node.bounds, node.layout, padding);

		renderBoxBackground(ctx, node.bounds, style);
		renderBoxBorder(ctx, node.bounds, style, { borderColor: style.borderColor });

		ctx.fillStyle = style.color ?? "#FFFFFF";
		ctx.font = style.font ?? "14px sans-serif";
		ctx.textAlign = style.textAlign ?? "left";
		ctx.textBaseline = style.textBaseline ?? "middle";

		const textX = resolveTextX(content.contentX, content.contentWidth, style.textAlign);
		const textY = resolveTextY(content.contentY, content.contentHeight, style.textBaseline);

		ctx.fillText(String(node.text ?? ""), textX, textY);
	}
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

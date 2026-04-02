import { Behavior } from './Behaviour.js';

// filepath: d:\italianCheeseAholic\client\src\engine\nodes\behaviours\verticalBehaviour.js

export class VerticalBehavior extends Behavior {
    constructor(node, spacing = 0) {
        super(node);
        this.spacing = spacing;
    }

    measure(node, constraints, ctx) {
        const style = node.style ?? {};
        const { maxWidth: constraintMaxWidth, maxHeight: constraintMaxHeight } = this.normalizeConstraints(constraints);
        let maxWidth = 0;
        let totalHeight = 0;

        for (const child of node.children) {
            const childMeasure = child.measure(constraints, ctx);
            maxWidth = Math.max(maxWidth, childMeasure.width);
            totalHeight += childMeasure.height + this.spacing;
        }

        totalHeight = Math.max(0, totalHeight - this.spacing);

        const minWidth = this.resolveDimension(style.minWidth, {
            axis: "width",
            constraints,
            node,
            style,
            fallback: 0
        });
        const minHeight = this.resolveDimension(style.minHeight, {
            axis: "height",
            constraints,
            node,
            style,
            fallback: 0
        });

        const maxStyleWidth = this.resolveRawDimension(style.maxWidth, {
            axis: "width",
            constraints,
            node,
            style
        });
        const maxStyleHeight = this.resolveRawDimension(style.maxHeight, {
            axis: "height",
            constraints,
            node,
            style
        });

        const widthCap = Number.isFinite(maxStyleWidth)
            ? Math.min(constraintMaxWidth, maxStyleWidth)
            : constraintMaxWidth;
        const heightCap = Number.isFinite(maxStyleHeight)
            ? Math.min(constraintMaxHeight, maxStyleHeight)
            : constraintMaxHeight;

        const preferredWidth = this.resolveDimension(style.width, {
            axis: "width",
            constraints,
            node,
            style,
            fallback: maxWidth
        });
        const preferredHeight = this.resolveDimension(style.height, {
            axis: "height",
            constraints,
            node,
            style,
            fallback: totalHeight
        });

        return {
            width: this.clamp(preferredWidth, minWidth, widthCap),
            height: this.clamp(preferredHeight, minHeight, heightCap)
        };
    }

    layout(node, bounds, ctx) {
        const containerWidth = bounds.width;
        let currentY = bounds.y;

        for (const child of node.children) {
            const childMeasure = child.measure({ maxWidth: containerWidth, maxHeight: Infinity }, ctx);
            const childX = bounds.x + (containerWidth - childMeasure.width) / 2;

            child.applyLayout(
                {
                    x: childX,
                    y: currentY,
                    width: childMeasure.width,
                    height: childMeasure.height
                },
                ctx
            );

            currentY += childMeasure.height + this.spacing;
        }
    }

    update(node, dt, ctx) {
        // No container-specific update work; SceneNode handles child traversal.
    }

    render(node, ctx) {
        // Layout container only; child rendering is handled by SceneNode.
    }
}
import { Behavior } from './Behaviour.js';

// filepath: d:\italianCheeseAholic\client\src\engine\nodes\behaviours\verticalBehaviour.js

export class VerticalBehavior extends Behavior {
    constructor(node, spacing = 0) {
        super(node);
        this.spacing = spacing;
    }

    measure(node, constraints, ctx) {
        let maxWidth = 0;
        let totalHeight = 0;

        for (const child of node.children) {
            const childMeasure = child.measure(constraints, ctx);
            maxWidth = Math.max(maxWidth, childMeasure.width);
            totalHeight += childMeasure.height + this.spacing;
        }

        totalHeight = Math.max(0, totalHeight - this.spacing);

        return {
            width: Math.min(maxWidth, constraints.maxWidth ?? Infinity),
            height: Math.min(totalHeight, constraints.maxHeight ?? Infinity)
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
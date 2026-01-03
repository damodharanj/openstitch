import { Type, type Static } from '@sinclair/typebox';

export const StitchComponent = Type.Object({
    html: Type.String(), // html with tailwind classes
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
});

export type StitchComponent = Static<typeof StitchComponent>;

export const NodeData = Type.Object({
    component: StitchComponent,
    label: Type.Optional(Type.String()),
});

export type NodeData = Static<typeof NodeData>;

export const Node = Type.Object({
    id: Type.String(),
    position: Type.Object({
        x: Type.Number(),
        y: Type.Number(),
    }),
    data: NodeData,
    type: Type.Optional(Type.String()),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
});

export type Node = Static<typeof Node>;

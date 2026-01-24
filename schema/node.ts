import { Type, type Static } from '@sinclair/typebox';

export const StitchComponent = Type.Object({
    html: Type.String(), // html with tailwind classes
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
});

export type StitchComponent = Static<typeof StitchComponent>;

export const ImageComponent = Type.Object({
    src: Type.String(),
    alt: Type.Optional(Type.String()),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
});

export type ImageComponent = Static<typeof ImageComponent>;

export const DataSourceComponent = Type.Object({
    type: Type.String(), // 'querybook', 'api', etc.
    config: Type.Object({
        url: Type.Optional(Type.String()),
        query: Type.Optional(Type.String()),
        apiKey: Type.Optional(Type.String()),
        // QueryBook specific fields
        environmentId: Type.Optional(Type.String()),
        queryId: Type.Optional(Type.String()),
    }),
    data: Type.Optional(Type.Any()), // cached/fetched data
});

export type DataSourceComponent = Static<typeof DataSourceComponent>;

export const NodeData = Type.Union([
    Type.Object({
        type: Type.Literal('component'),
        component: StitchComponent,
        label: Type.Optional(Type.String()),
    }),
    Type.Object({
        type: Type.Literal('image'),
        image: ImageComponent,
        label: Type.Optional(Type.String()),
    }),
    Type.Object({
        type: Type.Literal('data_source'),
        dataSource: DataSourceComponent,
        label: Type.Optional(Type.String()),
    }),
]);

export type NodeData = Static<typeof NodeData>;

export const Node = Type.Object({
    id: Type.String(),
    position: Type.Object({
        x: Type.Number(),
        y: Type.Number(),
    }),
    data: NodeData,
    type: Type.Optional(Type.String()), // ReactFlow node type
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
});

export type Node = Static<typeof Node>;

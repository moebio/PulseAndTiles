# Pulse & Tiles

**Pulse & Tiles** is a sophisticated, multi-year evolved library for **Data Science and Data Visualization**. At its heart is `pulse.js`, a comprehensive core that provides advanced data structures, processing utilities, and visualization primitives designed for complex, interactive data experiences.

## Core: pulse.js
`pulse.js` is the engine of the project. Developed over years of professional data consultancy and exploration, it extends native JavaScript capabilities with specialized data types and processing logic:
- **Specialized Data Structures**: Custom implementations for Lists (`L`), Points (`P`, `P3D`), Rectangles (`Rec`), and dynamic Tables (`T`).
- **Graph & Network Intelligence**: Advanced Node (`Nd`) and relation management, including network builders and layout algorithms.
- **Data Transformation**: Robust utilities for data cleaning, sanitization (e.g., `repairJsonString`), and quantitative parsing (`parseQuantitativeLiteral`).
- **Seamless Integration**: Built-in support for multiple module systems (AMD, CommonJS) and browser environments.

## The "Tiles" System
The library provides a modular "Tile" architecture for rapid construction of diverse visualizations:
- **Networks & Graphs**: `Net`, `GeoNet` (spatially-aware networks), and `Hive` plots.
- **Geospatial**: Deep integration with mapping libraries (Leaflet, etc.) for `Map` visualizations and geo-referenced data.
- **Hierarchical Data**: Powerful `Tree` and `Squarify` (Treemap) implementations.
- **Statistical Visualization**: `Scatter` plots, `Distributions`, `Axis` management, and `TextsMatrix`.
- **UI Elements**: A set of bespoke interface components like `Tooltip`, `Menu`, and specialized `InputText`.

## Data Science, AI & 3D Capabilities
Pulse & Tiles bridges traditional visualization with modern Data Science and immersive environments:
- **3D Engine**: A dedicated `Engine3D` for spatial computing and 3D visualization, supported by native 3D data types (`P3D`, `Pol3D`). It includes support for custom bases, projections, and complex 3D geometry management.
- **AI Integration**: High-level wrappers for OpenAI (ChatGPT API), Anthropic (LLMs), and custom LLM systems for agentic data exploration.
- **Mathematical Foundations**: Includes Principal Component Analysis (`PCA`), Voronoi diagrams, and high-performance numeric processing via `numeric.js`.
- **Advanced Projections**: Tools for `t-SNE` and other projection techniques to visualize high-dimensional data.


## The MetaCanvas Suite
A powerful abstraction for high-performance canvas manipulation:
- **Advanced Drawing**: A complete suite of drawing primitives (`fRect`, `sCircle`, `bezier`, `fPolygon`, etc.) with built-in state management.
- **Interaction Engine**: Native support for mouse and touch interactions, including point-in-shape detection (`mouseIn`, `fsCircleM`) and custom event emitters.
- **Geometric Transformations**: Robust support for coordinate system transformations, rotation, scaling, and clipping, integrated directly into the drawing pipeline.
- **Animation Control**: Built-in main loop management with frame-rate control and lifecycle hooks (`init`, `cycle`, `onResize`).

## Project Structure

- **/libraries**: Core dependencies and data science modules (AI wrappers, Math, Stats).
- **/Tiles**: Modular visualization components.
- **/Views**: High-level visual compositions and complex layouts.
- **/Elements**: Fundamental UI and visualization primitives.

---
*Created and maintained by Santiago Ortiz (Moebio).*
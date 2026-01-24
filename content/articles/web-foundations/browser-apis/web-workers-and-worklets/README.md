# Draft: Web Workers and Worklets for Off-Main-Thread Work

Concurrency primitives for keeping the main thread responsive.

## TLDR

- Workers run JavaScript off the main thread with message passing
- Worklets enable low-latency rendering and audio processing
- Structured cloning and transferables drive performance

## Outline

1. Worker types and capabilities
2. Communication patterns and transferables
3. Worklets: paint, layout, and audio
4. SharedArrayBuffer and cross-origin isolation
5. Debugging and profiling workers
6. Use-case decision matrix

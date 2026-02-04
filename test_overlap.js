function _rectsOverlap(x0, y0, w0, h0, x1, y1, w1, h1) {
    let x0_min = x0 - w0 * 0.5;
    let x0_max = x0 + w0 * 0.5;
    let y0_min = y0 - h0 * 0.5;
    let y0_max = y0 + h0 * 0.5;

    let x1_min = x1 - w1 * 0.5;
    let x1_max = x1 + w1 * 0.5;
    let y1_min = y1 - h1 * 0.5;
    let y1_max = y1 + h1 * 0.5;

    let interX_min = Math.max(x0_min, x1_min);
    let interX_max = Math.min(x0_max, x1_max);
    let interY_min = Math.max(y0_min, y1_min);
    let interY_max = Math.min(y0_max, y1_max);

    let interW = Math.max(0, interX_max - interX_min);
    let interH = Math.max(0, interY_max - interY_min);
    let interArea = interW * interH;

    if (interArea === 0) return 0;

    let area0 = w0 * h0;
    let area1 = w1 * h1;
    let unionArea = area0 + area1 - interArea;

    return interArea / unionArea;
}

const tests = [
    { args: [0, 0, 10, 10, 0, 0, 10, 10], expected: 1, label: "Total overlap" },
    { args: [0, 0, 10, 10, 20, 20, 10, 10], expected: 0, label: "No overlap" },
    { args: [0, 0, 10, 10, 5, 0, 10, 10], expected: 50 / 150, label: "Partial overlap (side-by-side)" },
    { args: [0, 0, 10, 10, 0, 5, 10, 10], expected: 50 / 150, label: "Partial overlap (top-to-bottom)" },
    { args: [0, 0, 20, 20, 0, 0, 10, 10], expected: 100 / 400, label: "Nested overlap" }
];

tests.forEach(test => {
    const result = _rectsOverlap(...test.args);
    const passed = Math.abs(result - test.expected) < 1e-9;
    console.log(`${passed ? "✅" : "❌"} ${test.label}: expected ${test.expected.toFixed(4)}, got ${result.toFixed(4)}`);
});

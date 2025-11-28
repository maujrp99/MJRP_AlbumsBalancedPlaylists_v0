/**
 * SvgGenerator.js
 * Utility class for generating dynamic SVGs programmatically.
 */

export class SvgGenerator {
    /**
     * Generates a mathematical equalizer pattern inside an SVG element.
     * @param {SVGElement} svgElem - The target SVG element to render into.
     * @param {Object} options - Configuration options.
     * @param {number} options.numCols - Number of vertical columns (default: 40).
     * @param {number} options.maxBlocks - Maximum height in blocks (default: 28).
     * @param {number} options.gap - Gap between blocks in pixels (default: 2).
     * @param {number} options.heightRatio - Ratio of SVG height to use (default: 0.33).
     * @param {number} options.headroomRatio - Ratio of effective height to leave empty at top (default: 0.10).
     * @param {boolean} options.showGuide - Whether to show the height limit guide lines (default: false).
     */
    static generateEqualizer(svgElem, options = {}) {
        const {
            numCols = 40,
            maxBlocks = 28,
            gap = 2,
            heightRatio = 0.33,
            headroomRatio = 0.10,
            showGuide = false
        } = options;

        // Clear existing content
        while (svgElem.firstChild) {
            svgElem.removeChild(svgElem.firstChild);
        }

        const svgWidth = svgElem.clientWidth;
        const svgHeight = svgElem.clientHeight;

        // Calculation of effective area
        const effectiveAreaHeight = svgHeight * heightRatio;
        const areaStartY = svgHeight - effectiveAreaHeight;

        // Optional Guide Lines
        if (showGuide) {
            // 33% Limit Line
            const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            guideLine.setAttribute("x1", 0);
            guideLine.setAttribute("y1", areaStartY);
            guideLine.setAttribute("x2", svgWidth);
            guideLine.setAttribute("y2", areaStartY);
            guideLine.setAttribute("stroke", "#555");
            guideLine.setAttribute("stroke-width", "1");
            guideLine.setAttribute("stroke-dasharray", "5, 5");
            guideLine.setAttribute("opacity", "0.3");
            svgElem.appendChild(guideLine);

            // Headroom Line
            const headroomY = areaStartY + (effectiveAreaHeight * headroomRatio);
            const headroomLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            headroomLine.setAttribute("x1", 0);
            headroomLine.setAttribute("y1", headroomY);
            headroomLine.setAttribute("x2", svgWidth);
            headroomLine.setAttribute("y2", headroomY);
            headroomLine.setAttribute("stroke", "#d9534f");
            headroomLine.setAttribute("stroke-width", "1");
            headroomLine.setAttribute("stroke-dasharray", "2, 2");
            headroomLine.setAttribute("opacity", "0.5");
            svgElem.appendChild(headroomLine);
        }

        // Calculate Block Dimensions
        const availableWidth = svgWidth - (gap * (numCols + 1));
        const blockW = availableWidth / numCols;

        // Block height is based on the full effective area to keep grid consistent
        const availableHeightForBlocks = effectiveAreaHeight - (gap * (maxBlocks + 1));
        const blockH = availableHeightForBlocks > 0 ? availableHeightForBlocks / maxBlocks : 1;

        // Generate Input Data (Gaussian Shape + Noise)
        let inputData = [];
        for (let i = 0; i < numCols; i++) {
            let t = i / (numCols - 1);

            // Gaussian Peaks
            // Bass Peak (Left, t=0)
            let bassPeak = 1.0 * Math.exp(-Math.pow(t - 0.0, 2) / 0.04);
            // Mid-High Peak (Right-Center, t=0.65)
            let midHighPeak = 0.75 * Math.exp(-Math.pow(t - 0.65, 2) / 0.12);

            let shape = bassPeak + midHighPeak;
            let noise = Math.random() * 0.15;

            // Apply Headroom
            let rawValue = Math.max(0, shape + noise);
            let normalizedHeight = Math.min(1.0, rawValue);
            let finalHeightFactor = normalizedHeight * (1 - headroomRatio);

            let heightValue = Math.floor(finalHeightFactor * maxBlocks);
            inputData.push(heightValue);
        }

        // Color Interpolation Helper
        const getInterpolatedColor = (t) => {
            let r, g, b;
            t = Math.max(0, Math.min(1, t));

            if (t < 0.5) {
                // Green -> Yellow
                let localT = t * 2;
                r = Math.floor(255 * localT);
                g = 255;
                b = 0;
            } else {
                // Yellow -> Red
                let localT = (t - 0.5) * 2;
                r = 255;
                g = Math.floor(255 * (1 - localT));
                b = 0;
            }
            return `rgb(${r},${g},${b})`;
        };

        // Render Blocks
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < numCols; i++) {
            const colHeightInBlocks = inputData[i];
            const posX = gap + i * (blockW + gap);

            for (let j = 0; j < colHeightInBlocks; j++) {
                // Y Position: Start from bottom (svgHeight), move up by gaps and blocks
                const posY = svgHeight - gap - blockH - (j * (blockH + gap));

                // Color t is based on maxBlocks (relative to full 33% area)
                const t = j / (maxBlocks - 1);
                const color = getInterpolatedColor(t);

                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", posX.toFixed(2));
                rect.setAttribute("y", posY.toFixed(2));
                rect.setAttribute("width", blockW.toFixed(2));
                rect.setAttribute("height", blockH.toFixed(2));
                rect.setAttribute("fill", color);

                fragment.appendChild(rect);
            }
        }

        svgElem.appendChild(fragment);
    }

    /**
     * Generates the MJRP Logo (Vinyl on Fire) inside an SVG element.
     * @param {SVGElement} svgElem - The target SVG element to render into.
     * @param {Object} options - Configuration options.
     */
    static generateLogo(svgElem, options = {}) {
        const {
            text = "MJRP",
            primaryColor = "#1a1a1a",
            gradientStart = "#ff2a00",
            gradientEnd = "#ffae00",
            width = 600,
            height = 400
        } = options;

        // Clear existing content
        while (svgElem.firstChild) {
            svgElem.removeChild(svgElem.firstChild);
        }

        svgElem.setAttribute("viewBox", `0 0 600 400`);
        const svgNS = "http://www.w3.org/2000/svg";

        // Constants
        const cx = 200;
        const cy = 230;
        const r = 110;

        // 1. Definições (Gradientes)
        const defs = document.createElementNS(svgNS, "defs");
        const uniqueId = `fireGradient_${Math.random().toString(36).substr(2, 9)}`;

        const gradient = document.createElementNS(svgNS, "linearGradient");
        gradient.id = uniqueId;
        gradient.setAttribute("x1", "0%"); gradient.setAttribute("y1", "100%");
        gradient.setAttribute("x2", "100%"); gradient.setAttribute("y2", "0%");

        const stop1 = document.createElementNS(svgNS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", gradientStart);

        const stop2 = document.createElementNS(svgNS, "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", gradientEnd);

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svgElem.appendChild(defs);

        // 2. Shape Base (Fogo + Seta)
        const path = document.createElementNS(svgNS, "path");
        const d = `
            M ${cx - 50} ${cy + r}        
            Q ${cx} ${cy + r + 20} ${cx + 80} ${cy + r - 20}
            L ${cx + 250} ${cy + 20}
            Q ${cx + 270} ${cy} ${cx + 250} ${cy - 20}
            L ${cx + 120} ${cy - 100}
            C ${cx + 100} ${cy - 150}, ${cx + 60} ${cy - 180}, ${cx + 40} ${cy - 200}
            Q ${cx + 20} ${cy - 150}, ${cx} ${cy - 120}
            C ${cx - 20} ${cy - 160}, ${cx - 50} ${cy - 140}, ${cx - 70} ${cy - 100}
            Q ${cx - 130} ${cy} ${cx - 110} ${cy + 80}
            Q ${cx - 100} ${cy + r} ${cx - 50} ${cy + r}
            Z
        `;
        path.setAttribute("d", d);
        path.setAttribute("fill", `url(#${uniqueId})`);
        path.setAttribute("filter", "drop-shadow(3px 5px 2px rgba(0,0,0,0.4))");
        svgElem.appendChild(path);

        // 3. Grupo do Vinil
        const vinylGroup = document.createElementNS(svgNS, "g");

        // Base
        const base = document.createElementNS(svgNS, "circle");
        base.setAttribute("cx", cx - 20); base.setAttribute("cy", cy);
        base.setAttribute("r", r - 25); base.setAttribute("fill", primaryColor);
        vinylGroup.appendChild(base);

        // Sulcos
        for (let i = 20; i < (r - 30); i += 6) {
            const groove = document.createElementNS(svgNS, "circle");
            groove.setAttribute("cx", cx - 20); groove.setAttribute("cy", cy);
            groove.setAttribute("r", i);
            groove.setAttribute("fill", "none");
            groove.setAttribute("stroke", "#333");
            groove.setAttribute("stroke-width", "2");
            groove.setAttribute("opacity", "0.6");
            vinylGroup.appendChild(groove);
        }

        // Centro
        const centerLabel = document.createElementNS(svgNS, "circle");
        centerLabel.setAttribute("cx", cx - 20); centerLabel.setAttribute("cy", cy);
        centerLabel.setAttribute("r", 25); centerLabel.setAttribute("fill", `url(#${uniqueId})`);
        vinylGroup.appendChild(centerLabel);

        const centerHole = document.createElementNS(svgNS, "circle");
        centerHole.setAttribute("cx", cx - 20); centerHole.setAttribute("cy", cy);
        centerHole.setAttribute("r", 8); centerHole.setAttribute("fill", primaryColor);
        vinylGroup.appendChild(centerHole);

        svgElem.appendChild(vinylGroup);

        // 4. Texto
        const textGroup = document.createElementNS(svgNS, "g");
        const svgText = document.createElementNS(svgNS, "text");
        svgText.setAttribute("x", cx - 60);
        svgText.setAttribute("y", cy + 30);
        svgText.setAttribute("font-family", "Arial, Helvetica, sans-serif");
        svgText.setAttribute("font-weight", "900");
        svgText.setAttribute("font-size", "100");
        svgText.setAttribute("fill", primaryColor);
        svgText.textContent = text;
        textGroup.appendChild(svgText);

        // 5. Braço do 'J' (Linha de conexão)
        const armLine = document.createElementNS(svgNS, "line");
        armLine.setAttribute("x1", cx + 25);
        armLine.setAttribute("y1", cy + 10);
        armLine.setAttribute("x2", cx - 20);
        armLine.setAttribute("y2", cy);
        armLine.setAttribute("stroke", primaryColor);
        armLine.setAttribute("stroke-width", "12");
        armLine.setAttribute("stroke-linecap", "round");

        svgElem.appendChild(armLine);
        svgElem.appendChild(textGroup);
    }
}

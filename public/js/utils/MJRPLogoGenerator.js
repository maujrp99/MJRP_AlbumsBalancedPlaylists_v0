/**
 * MJRPLogoGenerator
 * Um gerador procedural de logos SVG no estilo "Vinil em Chamas".
 * Encapsulado em ES6 Class para uso em projetos modernos.
 */
export class MJRPLogoGenerator {
    /**
     * @param {Object} options - Configurações iniciais
     * @param {string} options.text - O texto do logo (ex: "MJRP")
     * @param {string} options.primaryColor - Cor principal (vinil e texto)
     * @param {string} options.gradientStart - Cor inicial do degradê (fogo)
     * @param {string} options.gradientEnd - Cor final do degradê (fogo)
     * @param {number} options.width - Largura do SVG
     * @param {number} options.height - Altura do SVG
     */
    constructor({
        text = "MJRP",
        primaryColor = "#1a1a1a",
        gradientStart = "#ff2a00",
        gradientEnd = "#ffae00",
        width = 600,
        height = 400
    } = {}) {
        this.config = { text, primaryColor, gradientStart, gradientEnd, width, height };

        // Constantes internas de geometria (baseadas no viewBox original)
        this.cx = 200; // Centro X do vinil
        this.cy = 230; // Centro Y do vinil
        this.r = 110;  // Raio
        this.svgNS = "http://www.w3.org/2000/svg";
    }

    /**
     * Atualiza as configurações da instância.
     * @param {Object} newOptions - Novas opções para mesclar com as atuais.
     */
    updateConfig(newOptions) {
        this.config = { ...this.config, ...newOptions };
    }

    /**
     * Gera o elemento DOM do SVG.
     * @returns {SVGElement} O elemento SVG pronto para ser inserido no DOM.
     */
    render() {
        const { width, height, gradientStart, gradientEnd, primaryColor, text } = this.config;

        const svg = document.createElementNS(this.svgNS, "svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewBox", `0 0 600 400`); // ViewBox fixo para manter proporção da geometria interna
        svg.setAttribute("xmlns", this.svgNS);

        // 1. Definições (Gradientes)
        const defs = document.createElementNS(this.svgNS, "defs");
        const uniqueId = `fireGradient_${Math.random().toString(36).substr(2, 9)}`; // ID único para evitar conflitos na página

        const gradient = document.createElementNS(this.svgNS, "linearGradient");
        gradient.id = uniqueId;
        gradient.setAttribute("x1", "0%"); gradient.setAttribute("y1", "100%");
        gradient.setAttribute("x2", "100%"); gradient.setAttribute("y2", "0%");

        const stop1 = document.createElementNS(this.svgNS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", gradientStart);

        const stop2 = document.createElementNS(this.svgNS, "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", gradientEnd);

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);

        // 2. Shape Base (Fogo + Seta)
        const path = document.createElementNS(this.svgNS, "path");
        const d = this._getShapePath();
        path.setAttribute("d", d);
        path.setAttribute("fill", `url(#${uniqueId})`);
        path.setAttribute("filter", "drop-shadow(3px 5px 2px rgba(0,0,0,0.4))");
        svg.appendChild(path);

        // 3. Grupo do Vinil
        const vinylGroup = this._createVinylGroup(uniqueId, primaryColor);
        svg.appendChild(vinylGroup);

        // 4. Texto
        const textGroup = this._createTextGroup(text, primaryColor);

        // 5. Braço do 'J' (Linha de conexão)
        const armLine = document.createElementNS(this.svgNS, "line");
        armLine.setAttribute("x1", this.cx + 25);
        armLine.setAttribute("y1", this.cy + 10);
        armLine.setAttribute("x2", this.cx - 20);
        armLine.setAttribute("y2", this.cy);
        armLine.setAttribute("stroke", primaryColor);
        armLine.setAttribute("stroke-width", "12");
        armLine.setAttribute("stroke-linecap", "round");

        svg.appendChild(armLine);
        svg.appendChild(textGroup);

        return svg;
    }

    // --- Métodos Privados Auxiliares (Helpers) ---

    _getShapePath() {
        const { cx, cy, r } = this;
        return `
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
    }

    _createVinylGroup(gradientId, color) {
        const g = document.createElementNS(this.svgNS, "g");
        const { cx, cy, r } = this;

        // Base
        const base = document.createElementNS(this.svgNS, "circle");
        base.setAttribute("cx", cx - 20); base.setAttribute("cy", cy);
        base.setAttribute("r", r - 25); base.setAttribute("fill", color);
        g.appendChild(base);

        // Sulcos
        for (let i = 20; i < (r - 30); i += 6) {
            const groove = document.createElementNS(this.svgNS, "circle");
            groove.setAttribute("cx", cx - 20); groove.setAttribute("cy", cy);
            groove.setAttribute("r", i);
            groove.setAttribute("fill", "none");
            groove.setAttribute("stroke", "#333"); // Poderia ser parametrizável
            groove.setAttribute("stroke-width", "2");
            groove.setAttribute("opacity", "0.6");
            g.appendChild(groove);
        }

        // Centro
        const centerLabel = document.createElementNS(this.svgNS, "circle");
        centerLabel.setAttribute("cx", cx - 20); centerLabel.setAttribute("cy", cy);
        centerLabel.setAttribute("r", 25); centerLabel.setAttribute("fill", `url(#${gradientId})`);
        g.appendChild(centerLabel);

        const centerHole = document.createElementNS(this.svgNS, "circle");
        centerHole.setAttribute("cx", cx - 20); centerHole.setAttribute("cy", cy);
        centerHole.setAttribute("r", 8); centerHole.setAttribute("fill", color);
        g.appendChild(centerHole);

        return g;
    }

    _createTextGroup(text, color) {
        const g = document.createElementNS(this.svgNS, "g");
        const svgText = document.createElementNS(this.svgNS, "text");
        svgText.setAttribute("x", this.cx - 60);
        svgText.setAttribute("y", this.cy + 30);
        svgText.setAttribute("font-family", "Arial, Helvetica, sans-serif");
        svgText.setAttribute("font-weight", "900");
        svgText.setAttribute("font-size", "100");
        svgText.setAttribute("fill", color);
        svgText.textContent = text;
        g.appendChild(svgText);
        return g;
    }
}

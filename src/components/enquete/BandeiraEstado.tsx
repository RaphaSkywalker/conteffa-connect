import React from "react";

export type EstadoDetectado = "SP" | "PA" | "DF" | null;

const normalizeText = (value: string): string =>
    (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

export const detectarEstadoPorTitulo = (titulo: string): EstadoDetectado => {
    const clean = normalizeText(titulo);
    const tokens = clean.split(/[\s\-–—/(),.:]+/).filter(Boolean);

    if (
        clean.includes("sao paulo") ||
        tokens.includes("sp")
    ) {
        return "SP";
    }

    if (
        clean.includes("para") ||
        clean.includes("belem") ||
        tokens.includes("pa")
    ) {
        return "PA";
    }

    if (
        clean.includes("distrito federal") ||
        clean.includes("brasilia") ||
        tokens.includes("df")
    ) {
        return "DF";
    }

    return null;
};

const Star5 = ({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) => {
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? r : r * 0.382;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return <polygon points={points.join(" ")} fill={fill} />;
};

/**
 * Bandeira Oficial do Estado do Pará (proporção 14:20 -> 300x210)
 * Fundo vermelho, faixa diagonal branca do canto superior esquerdo ao inferior direito e estrela azul central.
 */
export const BandeiraParaSVG: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 300 210"
        className={className}
        role="img"
        aria-label="Bandeira do Estado do Pará"
    >
        <defs>
            <clipPath id="clip-pa">
                <rect x="0" y="0" width="300" height="210" rx="12" />
            </clipPath>
        </defs>
        <g clipPath="url(#clip-pa)">
            {/* Fundo vermelho */}
            <rect width="300" height="210" fill="#DA251D" />
            {/* Faixa diagonal branca */}
            <polygon points="0,0 68,0 300,162 300,210 232,210 0,48" fill="#FFFFFF" />
            {/* Estrela azul de 5 pontas no centro */}
            <Star5 cx={150} cy={105} r={27} fill="#0038A8" />
        </g>
    </svg>
);

/**
 * Bandeira Oficial do Estado de São Paulo (13 listras horizontais alternadas pretas e brancas,
 * cantão vermelho superior esquerdo com disco branco, mapa do Brasil em azul e 4 estrelas amarelas).
 */
export const BandeiraSaoPauloSVG: React.FC<{ className?: string }> = ({ className }) => {
    const stripeHeight = 195 / 13; // 15 unidades por listra (viewBox 300x195)
    return (
        <svg
            viewBox="0 0 300 195"
            className={className}
            role="img"
            aria-label="Bandeira do Estado de São Paulo"
        >
            <defs>
                <clipPath id="clip-sp">
                    <rect x="0" y="0" width="300" height="195" rx="12" />
                </clipPath>
            </defs>
            <g clipPath="url(#clip-sp)">
                {/* 13 listras horizontais (7 pretas e 6 brancas) */}
                {Array.from({ length: 13 }).map((_, idx) => (
                    <rect
                        key={idx}
                        x={0}
                        y={idx * stripeHeight}
                        width={300}
                        height={stripeHeight + 0.4}
                        fill={idx % 2 === 0 ? "#111111" : "#FFFFFF"}
                    />
                ))}

                {/* Cantão vermelho (altura de 5 listras = 75, largura = 120) */}
                <rect x={0} y={0} width={120} height={75} fill="#DA251D" />

                {/* Círculo branco central no cantão */}
                <circle cx={60} cy={37.5} r={24} fill="#FFFFFF" />

                {/* Silhueta estilizada do mapa do Brasil em azul marinho dentro do círculo branco */}
                <path
                    d="M50,21 L59,19 L66,23 L74,27 L77,33 L73,40 L68,45 L63,51 L58,56 L54,53 L55,47 L50,43 L45,38 L42,32 L45,26 Z"
                    fill="#1E3A8A"
                />

                {/* 4 estrelas amarelas nos cantos do cantão vermelho */}
                <Star5 cx={14} cy={13} r={6.5} fill="#FACC15" />
                <Star5 cx={106} cy={13} r={6.5} fill="#FACC15" />
                <Star5 cx={14} cy={62} r={6.5} fill="#FACC15" />
                <Star5 cx={106} cy={62} r={6.5} fill="#FACC15" />
            </g>
        </svg>
    );
};

export const BandeiraDistritoFederalSVG: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 300 210"
        className={className}
        role="img"
        aria-label="Bandeira do Distrito Federal"
    >
        <defs>
            <clipPath id="clip-df">
                <rect x="0" y="0" width="300" height="210" rx="12" />
            </clipPath>
        </defs>
        <g clipPath="url(#clip-df)">
            <rect width="300" height="210" fill="#FFFFFF" />
            <rect x="95" y="50" width="110" height="110" fill="#007A33" />
            {/* Cruz de Brasília em amarelo */}
            <path
                d="M150,68 L158,82 L154,82 L154,101 L173,101 L173,97 L187,105 L173,113 L173,109 L154,109 L154,128 L158,128 L150,142 L142,128 L146,128 L146,109 L127,109 L127,113 L113,105 L127,97 L127,101 L146,101 L146,82 L142,82 Z"
                fill="#FACC15"
            />
        </g>
    </svg>
);

export const BandeiraEstado: React.FC<{ tituloOpcao: string; className?: string }> = ({
    tituloOpcao,
    className = "w-72 md:w-96 h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl border-4 border-white/20",
}) => {
    const estado = detectarEstadoPorTitulo(tituloOpcao);

    if (estado === "SP") {
        return <BandeiraSaoPauloSVG className={className} />;
    }
    if (estado === "PA") {
        return <BandeiraParaSVG className={className} />;
    }
    if (estado === "DF") {
        return <BandeiraDistritoFederalSVG className={className} />;
    }

    return null;
};


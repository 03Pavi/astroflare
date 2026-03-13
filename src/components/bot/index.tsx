"use client";

import { useState, useEffect, useTransition } from "react";
import { Box, Typography, keyframes } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTypewriter } from "@/shared/hooks/use-type-writer";

// animations
const mysticalFloat = keyframes`
  0%,100%{transform:translateY(0) rotate(0)}
  50%{transform:translateY(-15px) rotate(2deg)}
`;

const bookHover = keyframes`
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-5px)}
`;

const pageFlip = keyframes`
  0%,100%{transform:scaleX(1)}
  50%{transform:scaleX(.8)}
`;

const sparkle = keyframes`
  0%,100%{opacity:0;transform:scale(.5)}
  50%{opacity:1;transform:scale(1.2)}
`;

const Bot = () => {
	const [isHovered, setIsHovered] = useState(false);
	const [showGreeting, setShowGreeting] = useState(false);
	const [isPending, startTransition] = useTransition();
	const { push } = useRouter();

	const isBubbleVisible = isHovered || showGreeting;

	const text = useTypewriter("I 'm Oracle!", 30, isBubbleVisible);

	useEffect(() => {
		const show = setTimeout(() => setShowGreeting(true), 1500);
		const hide = setTimeout(() => setShowGreeting(false), 9000);

		return () => {
			clearTimeout(show);
			clearTimeout(hide);
		};
	}, []);

	const openChat = () => {
		startTransition(() => push("/chat"));
	};

	return (
		<Box
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={openChat}
			sx={{
				position: "fixed",
				bottom: "2.5rem",
				right: "2.5rem",
				zIndex: 9999,
				cursor: "pointer",
				userSelect: "none",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			{/* Ink-Wash Parchment Message Bubble */}
			<Box
				sx={{
					position: "absolute",
					bottom: "125%",
					bgcolor: "#fffbf2", // Cream parchment
					color: "#2c3e50",
					px: 3,
					py: 1.5,
					width: "max-content",
					maxWidth: "160px",
					borderRadius: "24px 24px 24px 4px",
					boxShadow:
						"0 12px 40px rgba(0,0,0,0.15), inset 0 0 20px rgba(184, 134, 11, 0.05)",
					opacity: isBubbleVisible ? 1 : 0,
					transform: `scale(${isBubbleVisible ? 1 : 0.8}) translateY(${isBubbleVisible ? 0 : 20}px)`,
					transformOrigin: "bottom center",
					transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
					border: "2px solid #d4af37", // Gold border
					pointerEvents: "none",
					"&::after": {
						content: '""',
						position: "absolute",
						bottom: "-12px",
						left: "0",
						borderLeft: "12px solid #d4af37",
						borderBottom: "12px solid transparent",
					},
				}}
			>
				<Typography
					variant="body2"
					sx={{
						fontWeight: 600,
						fontFamily: '"Georgia", serif',
						fontSize: "0.9rem",
						fontStyle: "italic",
					}}
				>
					{text}
				</Typography>
			</Box>

			{/* Oracle Visual Container */}
			<Box
				sx={{
					position: "relative",
					width: 100,
					height: 100,
					animation: `${mysticalFloat} 5s ease-in-out infinite`,
					transition: "all 0.3s ease",
				}}
			>
				{/* Midnight Blue Aura */}
				<Box
					sx={{
						position: "absolute",
						inset: -20,
						background:
							"radial-gradient(circle, rgba(44, 62, 80, 0.15) 0%, transparent 70%)",
						borderRadius: "50%",
						opacity: isHovered ? 1 : 0.5,
						transition: "opacity 0.6s ease",
					}}
				/>

				{/* Celestial Librarian SVG */}
				<svg viewBox="0 0 100 100" width="100%" height="100%">
					{/* Main Body - Midnight Robes */}
					<path
						d="M30 35 Q50 15 70 35 L80 85 Q50 95 20 85 Z"
						fill="#1c2833"
						stroke="#d4af37"
						strokeWidth="1.5"
					/>

					{/* Scholarly Collar */}
					<path
						d="M35 40 Q50 50 65 40"
						fill="none"
						stroke="#d4af37"
						strokeWidth="2"
						strokeLinecap="round"
					/>

					{/* Librarian's Spectacles */}
					<g>
						<circle
							cx="40"
							cy="45"
							r="5"
							fill="none"
							stroke="#d4af37"
							strokeWidth="1"
						/>
						<circle
							cx="60"
							cy="45"
							r="5"
							fill="none"
							stroke="#d4af37"
							strokeWidth="1"
						/>
						<line
							x1="45"
							y1="45"
							x2="55"
							y2="45"
							stroke="#d4af37"
							strokeWidth="1"
						/>

						{/* Soft Glowing Eyes behind lenses */}
						<circle cx="40" cy="45" r="2" fill="#fff" opacity="0.6">
							<animate
								attributeName="opacity"
								values="0.6;0.2;0.6"
								dur="3s"
								repeatCount="indefinite"
							/>
						</circle>
						<circle cx="60" cy="45" r="2" fill="#fff" opacity="0.6">
							<animate
								attributeName="opacity"
								values="0.6;0.2;0.6"
								dur="3s"
								repeatCount="indefinite"
							/>
						</circle>
					</g>

					{/* Floating Scholarly Tome */}
					<g style={{ animation: `${bookHover} 3s ease-in-out infinite` }}>
						<rect
							x="65"
							y="55"
							width="25"
							height="18"
							rx="2"
							fill="#7b241c"
							stroke="#d4af37"
							strokeWidth="1"
						/>
						<line
							x1="77.5"
							y1="55"
							x2="77.5"
							y2="73"
							stroke="#d4af37"
							strokeWidth="0.5"
						/>
						{/* "Pages" flipping animation */}
						<g style={{ animation: `${pageFlip} 2s ease-in-out infinite` }}>
							<rect
								x="68"
								y="58"
								width="8"
								height="12"
								fill="#fdf5e6"
								opacity="0.8"
							/>
							<rect
								x="79"
								y="58"
								width="8"
								height="12"
								fill="#fdf5e6"
								opacity="0.8"
							/>
						</g>
					</g>

					{/* Quill Pen Detail */}
					<path
						d="M25 55 L15 75"
						stroke="#fff"
						strokeWidth="1.5"
						strokeLinecap="round"
						opacity="0.7"
					/>
					<path
						d="M15 75 Q18 78 22 75"
						fill="none"
						stroke="#fff"
						strokeWidth="1"
					/>

					{/* Celestial Dust / Sparkles */}
					<circle cx="30" cy="25" r="1" fill="#fff">
						<animate
							attributeName="opacity"
							values="0;1;0"
							dur="2s"
							repeatCount="indefinite"
						/>
					</circle>
					<circle cx="75" cy="20" r="1.5" fill="#d4af37">
						<animate
							attributeName="opacity"
							values="0;1;0"
							dur="2.5s"
							repeatCount="indefinite"
						/>
					</circle>
				</svg>

				{/* Hover Star Particles */}
				{isPending && (
					<Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
						<Typography
							sx={{
								position: "absolute",
								top: 0,
								left: "20%",
								fontSize: "10px",
								animation: `${sparkle} 1.5s infinite`,
							}}
						>
							✨
						</Typography>
						<Typography
							sx={{
								position: "absolute",
								top: 30,
								right: -5,
								fontSize: "12px",
								animation: `${sparkle} 2s infinite`,
							}}
						>
							🌟
						</Typography>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default Bot;

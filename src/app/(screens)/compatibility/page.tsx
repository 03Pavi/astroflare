"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShareIcon from "@mui/icons-material/Share";
import SyncIcon from "@mui/icons-material/Sync";
import StarIcon from "@mui/icons-material/Star";
import styles from "./page.module.scss";
import { useZodiac } from "@/context/zodiac-context";
import { Container } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { AshtakootResult } from "@/lib/ashtakoot";

const ThreeBackground = dynamic(
	() => import("@/components/home/three-background"),
	{ ssr: false },
);

type MatchInput = {
	year: number;
	month: number;
	date: number;
	hours: number;
	minutes: number;
	seconds: number;
	latitude: number;
	longitude: number;
	timezone?: number;
};

export default function CompatibilityPage() {
	const router = useRouter();
	const { charts } = useAppSelector((state) => state.charts);

	const { activeChart } = useZodiac();
	const [chartId1, setChartId1] = useState<string>("");
	const [chartId2, setChartId2] = useState<string>("");
	const [result, setResult] = useState<AshtakootResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [infoOpen, setInfoOpen] = useState(false);
	const theme = useTheme();
	const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

	useState(() => {
		if (activeChart?.$id) {
			setChartId1(activeChart.$id);
		}
	});

	useEffect(() => {
		if (activeChart?.$id) {
			setChartId1(activeChart.$id);
		}
	}, [activeChart]);

	useEffect(() => {
		if (!infoOpen || typeof window === "undefined") return;

		window.history.pushState({ compatibilityInfoDialog: true }, "");

		const onPopState = () => {
			setInfoOpen(false);
		};

		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, [infoOpen]);

	const buildMatchInput = (chart: any): MatchInput | null => {
		if (!chart?.birthDate || !chart?.birthTime) return null;
		const [year, month, date] = String(chart.birthDate)
			.split("-")
			.map((v) => Number.parseInt(v, 10));
		const [hours, minutes] = String(chart.birthTime)
			.split(":")
			.map((v) => Number.parseInt(v, 10));
		const latitude = Number(chart.latitude);
		const longitude = Number(chart.longitude);
		let timezone: number | undefined = undefined;

		if (chart.chartData) {
			try {
				const parsed = JSON.parse(chart.chartData);
				if (Number.isFinite(Number(parsed?.timezone))) {
					timezone = Number(parsed.timezone);
				}
			} catch {
				// no-op
			}
		}

		if (
			!Number.isFinite(year) ||
			!Number.isFinite(month) ||
			!Number.isFinite(date) ||
			!Number.isFinite(hours) ||
			!Number.isFinite(minutes) ||
			!Number.isFinite(latitude) ||
			!Number.isFinite(longitude)
		) {
			return null;
		}

		return {
			year,
			month,
			date,
			hours,
			minutes,
			seconds: 0,
			latitude,
			longitude,
			timezone,
		};
	};

	const handleCalculate = async () => {
		if (!chartId1 || !chartId2 || chartId1 === chartId2) return;
		setError("");

		const c1 = charts.find((c: any) => c.$id === chartId1);
		const c2 = charts.find((c: any) => c.$id === chartId2);
		if (!c1 || !c2) return;

		const male = buildMatchInput(c1);
		const female = buildMatchInput(c2);

		if (!male || !female) {
			setError(
				"Both charts must have valid date, time, latitude and longitude.",
			);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/compatibility", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					female,
					male,
					config: {
						observation_point: "topocentric",
						language: "en",
						ayanamsha: "lahiri",
					},
				}),
			});
			const data = await response.json();
			if (!response.ok || !data?.success) {
				throw new Error(data?.message || "Failed to calculate compatibility");
			}
			setResult(data.result as AshtakootResult);
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to calculate compatibility";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const getCompatibilityLevel = (total: number) => {
		if (total >= 26) return { label: "Excellent Match", color: "#10b981" };
		if (total >= 18) return { label: "Good Match", color: "#06b6d4" };
		if (total >= 10) return { label: "Average Match", color: "#f59e0b" };
		return { label: "Challenging Match", color: "#ef4444" };
	};

	const handleBack = () => {
		if (infoOpen) {
			setInfoOpen(false);
			return;
		}
		router.back();
	};

	return (
		<div className={styles.page}>
			<ThreeBackground />
			<div className={styles.gridOverlay} />

			<Container maxWidth="lg" className={styles.container}>
				<div className={styles.headerRow}>
					<button
						className={styles.iconBtn}
						onClick={handleBack}
						title="Go Back"
					>
						<ArrowBackIcon fontSize="small" />
					</button>
					<div className={styles.mainIconWrapper}>
						<FavoriteIcon sx={{ fontSize: 28, color: "#000" }} />
					</div>
					<button
						className={styles.iconBtn}
						title="Info"
						onClick={() => setInfoOpen(true)}
					>
						<InfoOutlinedIcon fontSize="small" />
					</button>
				</div>

				<h1 className={styles.title}>
					Synastry <span>Engine</span>
				</h1>
				<p className={styles.subtitle}>
					Traditional Vedic Ashtakoot calculations for deep relationship
					insights and compatibility analysis.
				</p>

				{!result ? (
					<>
						<div className={styles.selectionLayout}>
							<div className={styles.selectColumn}>
								<label className={styles.labelYellow}>PARTNER 1 (NATIVE)</label>
								<div className={styles.inputWrapper}>
									<select
										value={chartId1}
										onChange={(e) => setChartId1(e.target.value)}
									>
										<option value="">Select a chart...</option>
										{charts.map((c: any) => (
											<option
												key={c.$id}
												value={c.$id}
												disabled={c.$id === chartId2}
											>
												{c.label} ({c.birthDate})
											</option>
										))}
									</select>
									<WbSunnyIcon
										className={styles.inputIcon}
										sx={{ color: "#64748b", fontSize: 18 }}
									/>
								</div>
							</div>

							<div className={styles.syncIconBlock}>
								<SyncIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
							</div>

							<div className={styles.selectColumn}>
								<label className={styles.labelCyan}>PARTNER 2</label>
								<div className={styles.inputWrapper}>
									<select
										value={chartId2}
										onChange={(e) => setChartId2(e.target.value)}
									>
										<option value="">Select a chart...</option>
										{charts.map((c: any) => (
											<option
												key={c.$id}
												value={c.$id}
												disabled={c.$id === chartId1}
											>
												{c.label} ({c.birthDate})
											</option>
										))}
									</select>
									<NightsStayIcon
										className={styles.inputIcon}
										sx={{ color: "#64748b", fontSize: 18 }}
									/>
								</div>
							</div>
						</div>

						<button
							className={styles.calculateBtnSecondary}
							disabled={
								!chartId1 || !chartId2 || chartId1 === chartId2 || loading
							}
							onClick={handleCalculate}
						>
							{loading ? "Calculating..." : "Calculate >"}
						</button>
						{error ? <p className={styles.errorText}>{error}</p> : null}
					</>
				) : (
					<motion.div
						className={styles.resultsContainer}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
					>
						<div className={styles.topResultHeader}>
							<span className={styles.resultTypeLabel}>
								COMPATIBILITY ANALYSIS
							</span>
							<div className={styles.bigScore}>
								<span className={styles.scoreNumber}>
									{Math.round(result.total * 10) / 10}
								</span>
								<span className={styles.scoreMax}>/36</span>
							</div>
							<div className={styles.matchBadge}>
								<StarIcon sx={{ fontSize: 14 }} />{" "}
								{getCompatibilityLevel(result.total).label.toUpperCase()}
							</div>
						</div>

						<div className={styles.gunasGrid}>
							{[
								"varna",
								"vashya",
								"tara",
								"yoni",
								"grahaMaitri",
								"gana",
								"bhakoot",
								"nadi",
							].map((key) => {
								const guna = (result as any)[key];
								const pct = guna.score / guna.max;
								return (
									<div key={guna.name} className={styles.gunaCard}>
										<div className={styles.gunaTop}>
											<span className={styles.gunaName}>
												{guna.name.toUpperCase()}
											</span>
											<span className={styles.gunaScore}>
												{guna.score}/{guna.max}
											</span>
										</div>
										<div className={styles.gunaTrack}>
											<div
												className={styles.gunaFill}
												style={{ width: `${Math.max(5, pct * 100)}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>

						<div className={styles.bottomActions}>
							<button
								className={styles.newComparisonBtn}
								onClick={() => setResult(null)}
							>
								New Comparison
							</button>
							<button className={styles.shareBtn}>
								<ShareIcon fontSize="small" />
							</button>
						</div>
					</motion.div>
				)}
			</Container>

			<Dialog
				open={infoOpen}
				onClose={() => setInfoOpen(false)}
				fullScreen={isSmallScreen}
				fullWidth
				maxWidth="sm"
				PaperProps={{ className: styles.infoDialogPaper }}
			>
				<DialogTitle className={styles.infoDialogTitle}>
					What This Does
				</DialogTitle>
				<DialogContent className={styles.infoDialogContent}>
					<p>
						This screen runs Vedic Ashtakoot matching between two saved birth
						charts.
					</p>
					<p>
						It calculates the 8 koot scores (Varna, Vashya, Tara, Yoni, Graha
						Maitri, Gana, Bhakoot, Nadi) and gives a total score out of 36.
					</p>
					<p>
						Higher score means stronger traditional compatibility. Use this as
						one input along with communication, values, and real-life
						understanding.
					</p>
				</DialogContent>
				<DialogActions className={styles.infoDialogActions}>
					<button
						className={styles.dialogCloseBtn}
						onClick={() => setInfoOpen(false)}
					>
						Close
					</button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

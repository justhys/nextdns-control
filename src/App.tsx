import { useState, type CSSProperties } from "react";

type ApiResponse = {
	ok?: boolean;
	message?: string;
	instanceId?: string;
};

type PopupState = {
	open: boolean;
	success: boolean;
	title: string;
	message: string;
};

function App() {
	const [pin, setPin] = useState("");
	const [youtube, setYoutube] = useState(true);
	const [roblox, setRoblox] = useState(false);
	const [loading, setLoading] = useState(false);
	const [popup, setPopup] = useState<PopupState>({
		open: false,
		success: true,
		title: "",
		message: "",
	});

	const selectedServices = (): string[] => {
		const services: string[] = [];
		if (youtube) services.push("youtube");
		if (roblox) services.push("roblox");
		return services;
	};

	const showPopup = (success: boolean, message: string) => {
		setPopup({
			open: true,
			success,
			title: success ? "적용 완료" : "적용 실패",
			message,
		});
	};

	const closePopup = () => {
		setPopup((prev) => ({
			...prev,
			open: false,
		}));
	};

	const unlock = async (minutes: number) => {
		const services = selectedServices();

		if (services.length === 0) {
			showPopup(false, "YouTube 또는 Roblox를 선택하세요.");
			return;
		}

		if (!pin) {
			showPopup(false, "PIN을 입력하세요.");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/unlock", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					pin,
					minutes,
					services,
				}),
			});

			const data = (await response.json()) as ApiResponse;

			if (response.ok && data.ok !== false) {
				showPopup(
					true,
					data.message ?? "정상적으로 적용되었습니다.",
				);
				setPin("");
			} else {
				showPopup(
					false,
					data.message ?? "적용에 실패했습니다.",
				);
			}
		} catch (error) {
			console.error(error);
			showPopup(false, "서버와 통신 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// --------------------------------------------------
	// 즉시 다시 차단
	// --------------------------------------------------

	const lockNow = async () => {
		const services = selectedServices();

		if (services.length === 0) {
			showPopup(false, "YouTube 또는 Roblox를 선택하세요.");
			return;
		}

		if (!pin) {
			showPopup(false, "PIN을 입력하세요.");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/lock", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					pin,
					services,
				}),
			});

			const data = (await response.json()) as ApiResponse;

			if (response.ok && data.ok !== false) {
				showPopup(
					true,
					data.message ?? "정상적으로 차단했습니다.",
				);
				setPin("");
			} else {
				showPopup(
					false,
					data.message ?? "차단에 실패했습니다.",
				);
			}
		} catch (error) {
			console.error(error);
			showPopup(false, "서버와 통신 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// --------------------------------------------------
	// UI
	// --------------------------------------------------

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				<div style={styles.icon}>👨‍👩‍👧‍👦</div>
				<h1 style={styles.title}>Family Control</h1>
				<p style={styles.description}>
					허용할 앱을 선택하고 시간을 선택하세요.
				</p>

				<div style={styles.section}>
					<div style={styles.sectionTitle}>앱 선택</div>

					<label
						style={{
							...styles.service,
							...(youtube ? styles.serviceSelected : {}),
						}}
					>
						<div style={styles.serviceLeft}>
							<span style={styles.serviceIcon}>▶️</span>
							<span>YouTube</span>
						</div>

						<input
							type="checkbox"
							checked={youtube}
							onChange={(e) => setYoutube(e.target.checked)}
							style={styles.checkbox}
						/>
					</label>

					<label
						style={{
							...styles.service,
							...(roblox ? styles.serviceSelected : {}),
						}}
					>
						<div style={styles.serviceLeft}>
							<span style={styles.serviceIcon}>🎮</span>
							<span>Roblox</span>
						</div>

						<input
							type="checkbox"
							checked={roblox}
							onChange={(e) => setRoblox(e.target.checked)}
							style={styles.checkbox}
						/>
					</label>
				</div>

				<div style={styles.section}>
					<div style={styles.sectionTitle}>PIN</div>

					<input
						style={styles.input}
						type="password"
						inputMode="numeric"
						placeholder="PIN 입력"
						value={pin}
						onChange={(e) => setPin(e.target.value)}
					/>
				</div>

				<div style={styles.section}>
					<div style={styles.sectionTitle}>허용 시간</div>

					<button
						style={styles.button}
						disabled={loading}
						onClick={() => unlock(15)}
					>
						15분 허용
					</button>

					<button
						style={styles.button}
						disabled={loading}
						onClick={() => unlock(30)}
					>
						30분 허용
					</button>

					<button
						style={styles.button}
						disabled={loading}
						onClick={() => unlock(60)}
					>
						60분 허용
					</button>
				</div>

				<button
					style={styles.secondaryButton}
					disabled={loading}
					onClick={lockNow}
				>
					선택한 앱 지금 차단
				</button>
			</div>

			{loading && (
				<div style={styles.loadingOverlay}>
					<div style={styles.loadingBox}>
						<div style={styles.spinner}>⏳</div>
						<div>적용 중...</div>
					</div>
				</div>
			)}

			{popup.open && (
				<div style={styles.modalOverlay} onClick={closePopup}>
					<div
						style={styles.modal}
						onClick={(e) => e.stopPropagation()}
					>
						<div style={styles.modalIcon}>
							{popup.success ? "✅" : "⚠️"}
						</div>

						<h2 style={styles.modalTitle}>
							{popup.title}
						</h2>

						<p style={styles.modalMessage}>
							{popup.message}
						</p>

						<button
							style={
								popup.success
									? styles.confirmButton
									: styles.errorButton
							}
							onClick={closePopup}
						>
							확인
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

const styles: Record<string, CSSProperties> = {
	page: {
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		maxWidth: "460px",
		margin: "0 auto",
		padding: "24px 18px",
		background: "#f5f5f7",
		minHeight: "100vh",

		boxSizing: "border-box",
	},

	card: {
		background: "#ffffff",
		borderRadius: "24px",
		padding: "28px 22px",
		boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
	},
	icon: {
		fontSize: "36px",
		textAlign: "center",
	},

	icon: {
		fontSize: "36px",
		textAlign: "center",
	},

	title: {
		textAlign: "center",
		fontSize: "28px",
		marginTop: "10px",
		marginBottom: "6px",
	},

	description: {
		textAlign: "center",
		color: "#666",
		fontSize: "15px",
		marginBottom: "28px",
	},
	section: {
		marginBottom: "22px",
	},
	sectionTitle: {
		fontSize: "14px",
		fontWeight: 600,
		color: "#666",
		marginBottom: "8px",
	},
	service: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "16px",
		border: "1px solid #dddddd",
		borderRadius: "14px",
		marginBottom: "10px",
		cursor: "pointer",
		fontSize: "18px",
		background: "#ffffff",
	},
	serviceSelected: {
		border: "2px solid #111111",
		background: "#fafafa",
	},
	serviceLeft: {
		display: "flex",
		alignItems: "center",
		gap: "12px",
	},
	serviceIcon: {
		fontSize: "24px",
	},
	checkbox: {
		width: "22px",
		height: "22px",
	},

	service: {
		display: "flex",

		alignItems: "center",

		justifyContent:
			"space-between",

		padding: "16px",

		border:
			"1px solid #dddddd",

		borderRadius: "14px",

		marginBottom: "10px",

		cursor: "pointer",

		fontSize: "18px",

		background: "#ffffff",
	},

	serviceSelected: {
		border:
			"2px solid #111111",

		background: "#fafafa",
	},

	serviceLeft: {
		display: "flex",

		alignItems: "center",

		gap: "12px",
	},

	serviceIcon: {
		fontSize: "24px",
	},

	checkbox: {
		width: "22px",
		height: "22px",
	},

	input: {
		width: "100%",

		fontSize: "22px",
		padding: "15px",
		boxSizing: "border-box",
		borderRadius: "14px",
		border: "1px solid #cccccc",
		outline: "none",
	},

	button: {
		width: "100%",
		fontSize: "19px",
		fontWeight: 600,
		padding: "16px",

		border: "none",

		borderRadius: "14px",
		margin: "6px 0",
		background: "#111111",
		color: "#ffffff",
		cursor: "pointer",
	},

	secondaryButton: {
		width: "100%",
		fontSize: "17px",
		fontWeight: 600,
		padding: "15px",
		border: "none",

		borderRadius: "14px",
		marginTop: "4px",
		background: "#777777",
		color: "#ffffff",
		cursor: "pointer",
	},
	loadingOverlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: "rgba(0,0,0,0.25)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 999,
	},
	loadingBox: {
		background: "#ffffff",
		borderRadius: "18px",
		padding: "24px 34px",
		boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
		textAlign: "center",
		fontSize: "17px",
		fontWeight: 600,
	},
	spinner: {
		fontSize: "30px",
		marginBottom: "8px",
	},
	modalOverlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: "rgba(0,0,0,0.45)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "24px",
		zIndex: 1000,
	},
	modal: {
		width: "100%",
		maxWidth: "330px",
		background: "#ffffff",
		borderRadius: "24px",
		padding: "30px 24px 24px",
		boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
		textAlign: "center",
	},
	modalIcon: {
		fontSize: "48px",
		marginBottom: "12px",
	},
	modalTitle: {
		fontSize: "23px",
		margin: "0 0 12px 0",
	},
	modalMessage: {
		fontSize: "17px",
		lineHeight: 1.5,
		color: "#555",
		margin: "0 0 24px 0",
		whiteSpace: "pre-wrap",
	},
	confirmButton: {
		width: "100%",
		border: "none",
		borderRadius: "14px",
		padding: "15px",
		fontSize: "18px",
		fontWeight: 600,
		color: "#ffffff",
		background: "#111111",
		cursor: "pointer",
	},
	errorButton: {
		width: "100%",
		border: "none",
		borderRadius: "14px",
		padding: "15px",
		fontSize: "18px",
		fontWeight: 600,
		color: "#ffffff",
		background: "#555555",
		cursor: "pointer",
	},
};

export default App;

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
				setPin("");
				showPopup(
					true,
					data.message ?? "정상적으로 적용되었습니다.",
				);
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
				setPin("");
				showPopup(
					true,
					data.message ?? "정상적으로 차단했습니다.",
				);
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

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				<div style={styles.header}>
					<div style={styles.icon}>👨‍👩‍👧‍👦</div>
					<h1 style={styles.title}>Family Control</h1>
					<p style={styles.description}>
						허용할 앱을 선택하고 시간을 선택하세요.
					</p>
				</div>

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

					<div style={styles.timeButtons}>
						<button
							style={styles.button}
							disabled={loading}
							onClick={() => unlock(15)}
						>
							15분
						</button>

						<button
							style={styles.button}
							disabled={loading}
							onClick={() => unlock(30)}
						>
							30분
						</button>

						<button
							style={styles.button}
							disabled={loading}
							onClick={() => unlock(60)}
						>
							60분
						</button>
					</div>
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
						<div style={styles.loadingIcon}>⏳</div>
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
							style={styles.confirmButton}
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
		width: "100%",
		minHeight: "100dvh",
		background: "#f5f5f7",
		boxSizing: "border-box",
		padding: "12px",
		display: "flex",
		justifyContent: "center",
		alignItems: "flex-start",
	},
	card: {
		width: "100%",
		maxWidth: "430px",
		background: "#ffffff",
		borderRadius: "24px",
		padding: "18px",
		boxSizing: "border-box",
		boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
	},
	header: {
		textAlign: "center",
		marginBottom: "14px",
	},
	icon: {
		fontSize: "28px",
		lineHeight: 1,
		marginBottom: "6px",
	},
	title: {
		fontSize: "26px",
		margin: "0 0 4px 0",
	},
	description: {
		fontSize: "14px",
		color: "#666",
		margin: 0,
	},
	section: {
		marginBottom: "14px",
	},
	sectionTitle: {
		fontSize: "13px",
		fontWeight: 700,
		color: "#666",
		marginBottom: "6px",
	},
	service: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		padding: "11px 14px",
		border: "1px solid #dddddd",
		borderRadius: "13px",
		marginBottom: "7px",
		cursor: "pointer",
		fontSize: "17px",
		background: "#ffffff",
		boxSizing: "border-box",
	},
	serviceSelected: {
		border: "2px solid #111111",
		background: "#fafafa",
	},
	serviceLeft: {
		display: "flex",
		alignItems: "center",
		gap: "10px",
	},
	serviceIcon: {
		fontSize: "21px",
	},
	checkbox: {
		width: "22px",
		height: "22px",
	},
	input: {
		width: "100%",
		height: "52px",
		fontSize: "20px",
		padding: "0 14px",
		boxSizing: "border-box",
		borderRadius: "13px",
		border: "1px solid #cccccc",
		outline: "none",
	},
	timeButtons: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: "8px",
	},
	button: {
		height: "52px",
		fontSize: "17px",
		fontWeight: 700,
		border: "none",
		borderRadius: "13px",
		background: "#111111",
		color: "#ffffff",
		cursor: "pointer",
	},
	secondaryButton: {
		width: "100%",
		height: "50px",
		fontSize: "16px",
		fontWeight: 700,
		border: "none",
		borderRadius: "13px",
		background: "#888888",
		color: "#ffffff",
		cursor: "pointer",
	},
	loadingOverlay: {
		position: "fixed",
		inset: 0,
		background: "rgba(0,0,0,0.28)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 999,
	},
	loadingBox: {
		background: "#ffffff",
		borderRadius: "18px",
		padding: "20px 30px",
		textAlign: "center",
		fontSize: "16px",
		fontWeight: 700,
		boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
	},
	loadingIcon: {
		fontSize: "28px",
		marginBottom: "6px",
	},
	modalOverlay: {
		position: "fixed",
		inset: 0,
		background: "rgba(0,0,0,0.45)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "20px",
		zIndex: 1000,
	},
	modal: {
		width: "100%",
		maxWidth: "320px",
		background: "#ffffff",
		borderRadius: "22px",
		padding: "26px 22px 20px",
		boxSizing: "border-box",
		textAlign: "center",
		boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
	},
	modalIcon: {
		fontSize: "42px",
		marginBottom: "8px",
	},
	modalTitle: {
		fontSize: "22px",
		margin: "0 0 8px 0",
	},
	modalMessage: {
		fontSize: "16px",
		lineHeight: 1.5,
		color: "#555",
		margin: "0 0 20px 0",
	},
	confirmButton: {
		width: "100%",
		height: "48px",
		border: "none",
		borderRadius: "13px",
		fontSize: "17px",
		fontWeight: 700,
		background: "#111111",
		color: "#ffffff",
		cursor: "pointer",
	},
};

export default App;
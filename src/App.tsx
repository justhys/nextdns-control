import {
	useState,
	type CSSProperties,
} from "react";

type ApiResponse = {
	ok?: boolean;
	message?: string;
	instanceId?: string;
};

function App() {
	const [pin, setPin] = useState("");

	const [youtube, setYoutube] =
		useState(true);

	const [roblox, setRoblox] =
		useState(false);

	const [result, setResult] =
		useState("");

	const [loading, setLoading] =
		useState(false);

	// --------------------------------------------------
	// 현재 선택된 서비스
	// --------------------------------------------------

	const selectedServices = (): string[] => {
		const services: string[] = [];

		if (youtube) {
			services.push("youtube");
		}

		if (roblox) {
			services.push("roblox");
		}

		return services;
	};

	// --------------------------------------------------
	// 일정 시간 허용
	// --------------------------------------------------

	const unlock = async (
		minutes: number,
	) => {
		const services =
			selectedServices();

		if (services.length === 0) {
			setResult(
				"YouTube 또는 Roblox를 선택하세요.",
			);

			return;
		}

		if (!pin) {
			setResult("PIN을 입력하세요.");

			return;
		}

		setLoading(true);
		setResult("");

		try {
			const response = await fetch(
				"/unlock",
				{
					method: "POST",

					headers: {
						"Content-Type":
							"application/json",
					},

					body: JSON.stringify({
						pin,
						minutes,
						services,
					}),
				},
			);

			const data =
				(await response.json()) as ApiResponse;

			setResult(
				data.message ?? "완료",
			);
		} catch (error) {
			console.error(error);

			setResult(
				"요청 중 오류가 발생했습니다.",
			);
		} finally {
			setLoading(false);
		}
	};

	// --------------------------------------------------
	// 즉시 다시 차단
	// --------------------------------------------------

	const lockNow = async () => {
		const services =
			selectedServices();

		if (services.length === 0) {
			setResult(
				"YouTube 또는 Roblox를 선택하세요.",
			);

			return;
		}

		if (!pin) {
			setResult("PIN을 입력하세요.");

			return;
		}

		setLoading(true);
		setResult("");

		try {
			const response = await fetch(
				"/lock",
				{
					method: "POST",

					headers: {
						"Content-Type":
							"application/json",
					},

					body: JSON.stringify({
						pin,
						services,
					}),
				},
			);

			const data =
				(await response.json()) as ApiResponse;

			setResult(
				data.message ?? "완료",
			);
		} catch (error) {
			console.error(error);

			setResult(
				"요청 중 오류가 발생했습니다.",
			);
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
				<div style={styles.icon}>
					👨‍👩‍👧‍👦
				</div>

				<h1 style={styles.title}>
					Family Control
				</h1>

				<p style={styles.description}>
					허용할 앱을 선택하고 시간을
					선택하세요.
				</p>

				{/* 앱 선택 */}

				<div style={styles.section}>
					<div
						style={
							styles.sectionTitle
						}
					>
						앱 선택
					</div>

					<label
						style={{
							...styles.service,
							...(youtube
								? styles.serviceSelected
								: {}),
						}}
					>
						<div
							style={
								styles.serviceLeft
							}
						>
							<span
								style={
									styles.serviceIcon
								}
							>
								▶️
							</span>

							<span>
								YouTube
							</span>
						</div>

						<input
							type="checkbox"
							checked={youtube}
							onChange={(e) =>
								setYoutube(
									e.target.checked,
								)
							}
							style={
								styles.checkbox
							}
						/>
					</label>

					<label
						style={{
							...styles.service,
							...(roblox
								? styles.serviceSelected
								: {}),
						}}
					>
						<div
							style={
								styles.serviceLeft
							}
						>
							<span
								style={
									styles.serviceIcon
								}
							>
								🎮
							</span>

							<span>
								Roblox
							</span>
						</div>

						<input
							type="checkbox"
							checked={roblox}
							onChange={(e) =>
								setRoblox(
									e.target.checked,
								)
							}
							style={
								styles.checkbox
							}
						/>
					</label>
				</div>

				{/* PIN */}

				<div style={styles.section}>
					<div
						style={
							styles.sectionTitle
						}
					>
						PIN
					</div>

					<input
						style={styles.input}
						type="password"
						inputMode="numeric"
						placeholder="PIN 입력"
						value={pin}
						onChange={(e) =>
							setPin(
								e.target.value,
							)
						}
					/>
				</div>

				{/* 시간 선택 */}

				<div style={styles.section}>
					<div
						style={
							styles.sectionTitle
						}
					>
						허용 시간
					</div>

					<button
						style={styles.button}
						disabled={loading}
						onClick={() =>
							unlock(15)
						}
					>
						15분 허용
					</button>

					<button
						style={styles.button}
						disabled={loading}
						onClick={() =>
							unlock(30)
						}
					>
						30분 허용
					</button>

					<button
						style={styles.button}
						disabled={loading}
						onClick={() =>
							unlock(60)
						}
					>
						60분 허용
					</button>
				</div>

				{/* 즉시 차단 */}

				<button
					style={
						styles.secondaryButton
					}
					disabled={loading}
					onClick={lockNow}
				>
					선택한 앱 지금 차단
				</button>

				{/* 결과 */}

				{(loading || result) && (
					<div
						style={
							styles.result
						}
					>
						{loading
							? "처리 중..."
							: result}
					</div>
				)}
			</div>
		</div>
	);
}

// --------------------------------------------------
// Styles
// --------------------------------------------------

const styles: Record<
	string,
	CSSProperties
> = {
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

		boxShadow:
			"0 8px 30px rgba(0,0,0,0.08)",
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

		border:
			"1px solid #cccccc",

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

	result: {
		marginTop: "20px",

		padding: "14px",

		borderRadius: "12px",

		background: "#f2f2f2",

		textAlign: "center",

		fontWeight: 600,

		whiteSpace: "pre-wrap",
	},
};

export default App;

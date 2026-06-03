import { useState } from "react";

function App() {
	const [pin, setPin] = useState("");
	const [result, setResult] = useState("");
	const [loading, setLoading] = useState(false);

	const unlock = async (minutes: number) => {
		setLoading(true);
		setResult("");

		try {
			const body = new FormData();
			body.append("pin", pin);
			body.append("minutes", String(minutes));

			const res = await fetch("/unlock", {
				method: "POST",
				body,
			});

			const data = await res.json();
			setResult(data.message ?? "완료");
		} catch {
			setResult("요청 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	const lockNow = async () => {
		setLoading(true);
		setResult("");

		try {
			const body = new FormData();
			body.append("pin", pin);

			const res = await fetch("/lock", {
				method: "POST",
				body,
			});

			const data = await res.json();
			setResult(data.message ?? "완료");
		} catch {
			setResult("요청 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				<h1 style={styles.title}>YouTube 허용</h1>
				<p style={styles.description}>PIN 입력 후 시간을 선택하세요.</p>

				<input
					style={styles.input}
					type="password"
					inputMode="numeric"
					placeholder="PIN"
					value={pin}
					onChange={(e) => setPin(e.target.value)}
				/>

				<button style={styles.button} disabled={loading} onClick={() => unlock(15)}>
					15분 허용
				</button>

				<button style={styles.button} disabled={loading} onClick={() => unlock(30)}>
					30분 허용
				</button>

				<button style={styles.button} disabled={loading} onClick={() => unlock(60)}>
					60분 허용
				</button>

				<button style={styles.secondaryButton} disabled={loading} onClick={lockNow}>
					지금 다시 차단
				</button>

				<div style={styles.result}>{loading ? "처리 중..." : result}</div>
			</div>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
	page: {
		fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
		maxWidth: "420px",
		margin: "40px auto",
		padding: "20px",
		background: "#f7f7f7",
		minHeight: "100vh",
		boxSizing: "border-box",
	},
	card: {
		background: "white",
		borderRadius: "18px",
		padding: "24px",
		boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
	},
	title: {
		fontSize: "24px",
		marginBottom: "8px",
	},
	description: {
		color: "#555",
	},
	input: {
		width: "100%",
		fontSize: "22px",
		padding: "14px",
		boxSizing: "border-box",
		borderRadius: "12px",
		border: "1px solid #ccc",
		marginBottom: "16px",
	},
	button: {
		width: "100%",
		fontSize: "20px",
		padding: "16px",
		border: "none",
		borderRadius: "14px",
		margin: "8px 0",
		background: "#111",
		color: "white",
	},
	secondaryButton: {
		width: "100%",
		fontSize: "20px",
		padding: "16px",
		border: "none",
		borderRadius: "14px",
		margin: "8px 0",
		background: "#777",
		color: "white",
	},
	result: {
		marginTop: "16px",
		fontWeight: 600,
		whiteSpace: "pre-wrap",
	},
};

export default App;
export { MyWorkflow } from "./workflow";
export { WorkflowStatusDO } from "./durable-object";

type UnlockRequest = {
	minutes?: number;
	pin?: string;
};

const ALLOWED_MINUTES = [15, 30, 60];

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/") {
			return htmlPage();
		}

		if (request.method === "POST" && url.pathname === "/unlock") {
			try {
				const body = await parseRequestBody(request);
				const minutes = Number(body.minutes);
				const pin = String(body.pin ?? "");

				if (pin !== getSecret(env, "ADMIN_PIN")) {
					return json({ ok: false, message: "PIN이 틀렸습니다." }, 401);
				}

				if (!ALLOWED_MINUTES.includes(minutes)) {
					return json({ ok: false, message: "허용 시간은 15/30/60분만 가능합니다." }, 400);
				}

				await setYoutubeBlocked(env, false);

				const instance = await env.MY_WORKFLOW.create({
					id: crypto.randomUUID(),
					params: {
						minutes,
						startedAt: Date.now(),
					},
				});

				return json({
					ok: true,
					message: `YouTube를 ${minutes}분 동안 허용했습니다.`,
					instanceId: instance.id,
				});
			} catch (error) {
				return json({
					ok: false,
					message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
				}, 500);
			}
		}

		if (request.method === "POST" && url.pathname === "/lock") {
			try {
				const body = await parseRequestBody(request);
				const pin = String(body.pin ?? "");

				if (pin !== getSecret(env, "ADMIN_PIN")) {
					return json({ ok: false, message: "PIN이 틀렸습니다." }, 401);
				}

				await setYoutubeBlocked(env, true);

				return json({
					ok: true,
					message: "YouTube를 다시 차단했습니다.",
				});
			} catch (error) {
				return json({
					ok: false,
					message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
				}, 500);
			}
		}

		return json({ ok: false, message: "Not Found" }, 404);
	},
} satisfies ExportedHandler<Env>;

async function parseRequestBody(request: Request): Promise<UnlockRequest> {
	const contentType = request.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return await request.json();
	}

	const form = await request.formData();

	return {
		pin: String(form.get("pin") ?? ""),
		minutes: Number(form.get("minutes")),
	};
}

async function setYoutubeBlocked(env: Env, blocked: boolean): Promise<void> {
	const profileId = getSecret(env, "NEXTDNS_PROFILE_ID");
	const apiKey = getSecret(env, "NEXTDNS_API_KEY");

	const endpoint =
		`https://api.nextdns.io/profiles/${profileId}` +
		`/parentalControl/services/youtube`;

	const res = await fetch(endpoint, {
		method: "PATCH",
		headers: {
			"X-Api-Key": apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			active: blocked,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`NextDNS API 실패: ${res.status} ${text}`);
	}
}

function getSecret(env: Env, key: string): string {
	const value = (env as unknown as Record<string, string | undefined>)[key];

	if (!value) {
		throw new Error(`${key} secret이 설정되지 않았습니다.`);
	}

	return value;
}

function htmlPage(): Response {
	return new Response(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>YouTube Control</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 420px;
      margin: 40px auto;
      padding: 20px;
      background: #f7f7f7;
    }
    .card {
      background: white;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #555; }
    input {
      width: 100%;
      font-size: 22px;
      padding: 14px;
      box-sizing: border-box;
      border-radius: 12px;
      border: 1px solid #ccc;
      margin-bottom: 16px;
    }
    button {
      width: 100%;
      font-size: 20px;
      padding: 16px;
      border: none;
      border-radius: 14px;
      margin: 8px 0;
      background: #111;
      color: white;
    }
    button.secondary { background: #777; }
    #result {
      margin-top: 16px;
      font-weight: 600;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>YouTube 허용</h1>
    <p>PIN 입력 후 시간을 선택하세요.</p>

    <input id="pin" type="password" inputmode="numeric" placeholder="PIN" />

    <button onclick="unlock(15)">15분 허용</button>
    <button onclick="unlock(30)">30분 허용</button>
    <button onclick="unlock(60)">60분 허용</button>
    <button class="secondary" onclick="lockNow()">지금 다시 차단</button>

    <div id="result"></div>
  </div>

<script>
async function unlock(minutes) {
  const body = new FormData();
  body.append("pin", document.getElementById("pin").value);
  body.append("minutes", minutes);

  const res = await fetch("/unlock", { method: "POST", body });
  const data = await res.json();

  document.getElementById("result").innerText = data.message || "완료";
}

async function lockNow() {
  const body = new FormData();
  body.append("pin", document.getElementById("pin").value);

  const res = await fetch("/lock", { method: "POST", body });
  const data = await res.json();

  document.getElementById("result").innerText = data.message || "완료";
}
</script>
</body>
</html>`, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

function json(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
export { MyWorkflow } from "./workflow";
export { WorkflowStatusDO } from "./durable-object";

type ControlRequest = {
	minutes?: number;
	pin?: string;
	services?: string[];
};

const ALLOWED_MINUTES = [15, 30, 60];
const ALLOWED_SERVICES = ["youtube", "roblox"];

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "POST" && url.pathname === "/unlock") {
			try {
				const body = await parseRequestBody(request);
				const pin = String(body.pin ?? "");
				const minutes = Number(body.minutes);
				const services = validateServices(body.services);

				if (pin !== getSecret(env, "ADMIN_PIN")) {
					return json(
						{
							ok: false,
							message: "PIN이 틀렸습니다.",
						},
						401,
					);
				}

				if (!ALLOWED_MINUTES.includes(minutes)) {
					return json(
						{
							ok: false,
							message: "허용 시간은 15/30/60분만 가능합니다.",
						},
						400,
					);
				}

				if (services.length === 0) {
					return json(
						{
							ok: false,
							message: "YouTube 또는 Roblox를 선택하세요.",
						},
						400,
					);
				}

				await Promise.all(
					services.map((service) =>
						setServiceBlocked(env, service, false),
					),
				);

				const instance = await env.MY_WORKFLOW.create({
					id: crypto.randomUUID(),
					params: {
						minutes,
						services,
						startedAt: Date.now(),
					},
				});

				return json({
					ok: true,
					message: `${formatServices(services)}를 ${minutes}분 동안 허용했습니다.`,
					instanceId: instance.id,
				});
			} catch (error) {
				console.error("Unlock error:", error);

				return json(
					{
						ok: false,
						message:
							error instanceof Error
								? error.message
								: "알 수 없는 오류가 발생했습니다.",
					},
					500,
				);
			}
		}

		if (request.method === "POST" && url.pathname === "/lock") {
			try {
				const body = await parseRequestBody(request);
				const pin = String(body.pin ?? "");
				const services = validateServices(body.services);

				if (pin !== getSecret(env, "ADMIN_PIN")) {
					return json(
						{
							ok: false,
							message: "PIN이 틀렸습니다.",
						},
						401,
					);
				}

				if (services.length === 0) {
					return json(
						{
							ok: false,
							message: "YouTube 또는 Roblox를 선택하세요.",
						},
						400,
					);
				}

				await Promise.all(
					services.map((service) =>
						setServiceBlocked(env, service, true),
					),
				);

				return json({
					ok: true,
					message: `${formatServices(services)}를 차단했습니다.`,
				});
			} catch (error) {
				console.error("Lock error:", error);

				return json(
					{
						ok: false,
						message:
							error instanceof Error
								? error.message
								: "알 수 없는 오류가 발생했습니다.",
					},
					500,
				);
			}
		}

		return json(
			{
				ok: false,
				message: "Not Found",
			},
			404,
		);
	},
} satisfies ExportedHandler<Env>;

async function parseRequestBody(
	request: Request,
): Promise<ControlRequest> {
	const contentType = request.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		return (await request.json()) as ControlRequest;
	}

	const form = await request.formData();

	return {
		pin: String(form.get("pin") ?? ""),
		minutes: Number(form.get("minutes")),
		services: form
			.getAll("services")
			.map((value) => String(value)),
	};
}

function validateServices(services: unknown): string[] {
	if (!Array.isArray(services)) {
		return [];
	}

	return [
		...new Set(
			services
				.map((service) => String(service))
				.filter((service) =>
					ALLOWED_SERVICES.includes(service),
				),
		),
	];
}

async function setServiceBlocked(
	env: Env,
	service: string,
	blocked: boolean,
): Promise<void> {
	if (!ALLOWED_SERVICES.includes(service)) {
		throw new Error(`지원하지 않는 서비스입니다: ${service}`);
	}

	const profileId = getSecret(env, "NEXTDNS_PROFILE_ID");
	const apiKey = getSecret(env, "NEXTDNS_API_KEY");

	const endpoint =
		`https://api.nextdns.io/profiles/${profileId}` +
		`/parentalControl/services/${service}`;

	console.log(
		`NextDNS ${service}: ${blocked ? "BLOCK" : "ALLOW"}`,
	);

	const response = await fetch(endpoint, {
		method: "PATCH",
		headers: {
			"X-Api-Key": apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			active: blocked,
		}),
	});

	if (!response.ok) {
		const text = await response.text();

		throw new Error(
			`NextDNS ${service} API 실패: ${response.status} ${text}`,
		);
	}
}

function getSecret(env: Env, key: string): string {
	const value = (
		env as unknown as Record<string, string | undefined>
	)[key];

	if (!value) {
		throw new Error(`${key} secret이 설정되지 않았습니다.`);
	}

	return value;
}

function formatServices(services: string[]): string {
	return services
		.map((service) => {
			switch (service) {
				case "youtube":
					return "YouTube";
				case "roblox":
					return "Roblox";
				default:
					return service;
			}
		})
		.join(" + ");
}

function json(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
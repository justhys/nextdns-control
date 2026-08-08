import {
	WorkflowEntrypoint,
	WorkflowStep,
} from "cloudflare:workers";

import type {
	WorkflowEvent,
} from "cloudflare:workers";

type RelockPayload = {
	minutes: number;
	services: string[];
	startedAt: number;
};

const ALLOWED_MINUTES = [15, 30, 60];
const ALLOWED_SERVICES = ["youtube", "roblox"];

export class MyWorkflow extends WorkflowEntrypoint<
	Env,
	RelockPayload
> {
	async run(
		event: WorkflowEvent<RelockPayload>,
		step: WorkflowStep,
	) {
		const minutes = Number(
			event.payload.minutes,
		);

		const services = validateServices(
			event.payload.services,
		);

		if (!ALLOWED_MINUTES.includes(minutes)) {
			throw new Error(
				`Invalid minutes: ${minutes}`,
			);
		}

		if (services.length === 0) {
			throw new Error(
				"No valid services specified",
			);
		}

		console.log(
			"Workflow started:",
			{
				instanceId: event.instanceId,
				minutes,
				services,
			},
		);

		// --------------------------------------------------
		// 지정된 시간 동안 Workflow pause
		// --------------------------------------------------

		await step.sleep(
			`wait-${minutes}-minutes`,
			`${minutes} minutes`,
		);

		// --------------------------------------------------
		// 시간이 지나면 선택했던 서비스 다시 차단
		// --------------------------------------------------

		await step.do(
			"block-services-again",
			async () => {
				console.log(
					"Re-locking services:",
					services,
				);

				await Promise.all(
					services.map((service) =>
						setServiceBlocked(
							this.env,
							service,
							true,
						),
					),
				);

				return {
					blocked: services,
					blockedAt: Date.now(),
				};
			},
		);

		console.log(
			"Workflow completed:",
			{
				instanceId: event.instanceId,
				services,
			},
		);
	}
}

// --------------------------------------------------
// Service validation
// --------------------------------------------------

function validateServices(
	services: unknown,
): string[] {
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

// --------------------------------------------------
// NextDNS
// --------------------------------------------------

async function setServiceBlocked(
	env: Env,
	service: string,
	blocked: boolean,
): Promise<void> {
	if (!ALLOWED_SERVICES.includes(service)) {
		throw new Error(
			`Unsupported service: ${service}`,
		);
	}

	const profileId = getSecret(
		env,
		"NEXTDNS_PROFILE_ID",
	);

	const apiKey = getSecret(
		env,
		"NEXTDNS_API_KEY",
	);

	const endpoint =
		`https://api.nextdns.io/profiles/${profileId}` +
		`/parentalControl/services/${service}`;

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
			`NextDNS ${service} API 실패: ` +
			`${response.status} ${text}`,
		);
	}

	console.log(
		`NextDNS ${service}: BLOCKED`,
	);
}

// --------------------------------------------------
// Secrets
// --------------------------------------------------

function getSecret(
	env: Env,
	key: string,
): string {
	const value = (
		env as unknown as Record<
			string,
			string | undefined
		>
	)[key];

	if (!value) {
		throw new Error(
			`${key} secret이 설정되지 않았습니다.`,
		);
	}

	return value;
}

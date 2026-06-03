import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

type YoutubeRelockPayload = {
	minutes: number;
	startedAt: number;
};

export class MyWorkflow extends WorkflowEntrypoint<Env, YoutubeRelockPayload> {
	async run(event: WorkflowEvent<YoutubeRelockPayload>, step: WorkflowStep) {
		const minutes = Number(event.payload.minutes);

		if (![15, 30, 60].includes(minutes)) {
			throw new Error(`Invalid minutes: ${minutes}`);
		}

		await step.sleep(`wait-${minutes}-minutes`, `${minutes} minutes`);

		await step.do("block-youtube-again", async () => {
			await setYoutubeBlocked(this.env, true);
		});
	}
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
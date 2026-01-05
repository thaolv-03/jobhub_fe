export type ApplicationStatusNotificationPayload = {
  applicationId: string;
  jobId: number;
  jobSeekerId: number;
  status: string;
};

export async function sendApplicationStatusNotification(
  payload: ApplicationStatusNotificationPayload,
  accessToken?: string | null
) {
  return { delivered: false, payload, accessToken };
}

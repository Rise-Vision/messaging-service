module.exports = {
  wrongAuthorization: {
    code: 403,
    msg: "Not authorized"
  },
  missingId: {
    code: 400,
    msg: "Endpoint or display id (id) is required"
  },
  missingDisplayId: {
    code: 400,
    msg: "Display id (displayId) is required"
  },
  displaysNotAllowed: {
    code: 403,
    msg: "Displays are not allowed"
  },
  missingEndpointId: {
    code: 400,
    msg: "Endpoint id (endpointId) is required"
  },
  missingScheduleId: {
    code: 400,
    msg: "Schedule id (scheduleId) is required"
  },
  missingTopic: {
    code: 400,
    msg: "Topic (topic) is required"
  },
  missingFilePaths: {
    code: 400,
    msg: "File paths (filePaths) are required"
  },
  invalidSchedule: {
    code: 404,
    msg: "Schedule is not valid"
  },
  bannedEndpoint: {
    code: 403,
    msg: "Endpoint is banned"
  },
  invalidTopic: {
    code: 403,
    msg: "Topic is not valid"
  },
  noHandler: {
    code: 400,
    msg: "Request has no handler"
  }
};

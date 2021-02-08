module.exports = {
  wrongServerKey: {
    code: 403,
    msg: "Incorrect server key (sk)"
  },
  missingDisplayId: {
    code: 400,
    msg: "Display id (did) is required"
  },
  missingMsg: {
    code: 400,
    msg: "Message (msg) is requireds"
  },
  noHandler: {
    code: 400,
    msg: "Message has no handler"
  },
  missingCid: {
    code: 400,
    msg: "Client Id (cid) is required"
  },
  missingUrl: {
    code: 400,
    msg: "Url (url) is required"
  },
  missingId: {
    code: 400,
    msg: "Display or schedule id (id) is required"
  },
  missingKind: {
    code: 400,
    msg: "Kind (kind) is required"
  },
  missingAction: {
    code: 400,
    msg: "Action (action) is required"
  },
  invalidKind: {
    code: 400,
    msg: "Kind (kind) should be one of 'Display' or 'Schedule'"
  },
  invalidAction: {
    code: 400,
    msg: "Action (action) should be one of 'Added' or 'Removed'"
  }
};

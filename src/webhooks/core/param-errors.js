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
    msg: "Message (msg) is required"
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
  }
};

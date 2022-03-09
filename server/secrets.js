const SECRETS_MAPPING = {
  EXPRESS_SECRET: '',
  /*
   * Google OAuth app secrets (required)
   * https://console.developers.google.com/projectselector/apis/credentials
   */
  GOOGLE_CLIENT_ID:
  '',
  GOOGLE_CLIENT_SECRET: '',

  /*
   * Trello OAuth app secrets (optional)
   * https://trello.com/app-key
   */
  TRELLO_KEY: '',
  TRELLO_SECRET: '',
};

/**
 * Return secret from mapping, or null if it doesn’t exist.
 * @param {String} name of secret
 * @param {Dictionary} mapping of secrets, SECRETS_MAPPING by default
 * @return {String} secret
 */
function getSecret(name, mapping = SECRETS_MAPPING) {
  const secret = mapping[name] || null;
  return secret;
}

module.exports = {
  get: getSecret
};

export const ensureHttpsAndNoTrailingSlash = (url: string): string => {
  const hasProtocol = /^[a-z]+:\/\//i.test(url);
  const modifiedUrl = hasProtocol ? url : `https://${url}`;

  return modifiedUrl.endsWith('/') ? modifiedUrl.slice(0, -1) : modifiedUrl;
};

export const getApiKey = (apiKeys: string): string => {
  const trimmedApiKeys = apiKeys.endsWith(',') ? apiKeys.slice(0, -1) : apiKeys;
  const apiKeySelection = trimmedApiKeys.split(',').map((key) => key.trim());
  return apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
};

import apiClient from './apiClient';

export async function getOverview() {
  const { data } = await apiClient.get('/analytics/overview');
  return data;
}

export async function getChartData() {
  const { data } = await apiClient.get('/analytics/charts');
  return data;
}

export async function getProducts(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data } = await apiClient.get(`/products${query}`);
  return data;
}

export async function getReviewsByProduct(productId) {
  const { data } = await apiClient.get(`/reviews/${productId}`);
  return data;
}

export async function analyzeReview(reviewInput) {
  const payload = typeof reviewInput === 'string'
    ? { reviewId: reviewInput }
    : reviewInput;
  const { data } = await apiClient.post('/analyze-review', payload);
  return data;
}

export async function getDssInsights(threshold = 0.35) {
  const { data } = await apiClient.get(`/dss/insights?threshold=${encodeURIComponent(threshold)}`);
  return data;
}

export async function uploadDatasets(formData) {
  const { data } = await apiClient.post('/upload', formData);
  return data;
}

export async function analyzeProduct(productId, limit = 100, options = {}) {
  const { data } = await apiClient.post(`/analyze-product/${productId}`, {
    limit,
    generateReviews: options.generateReviews,
    generateCount: options.generateCount
  });
  return data;
}

export async function compareProducts(leftProductId, rightProductId) {
  const { data } = await apiClient.post('/compare-products', { leftProductId, rightProductId });
  return data;
}

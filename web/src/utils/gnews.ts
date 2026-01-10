export async function fetchGNews(query: string) {
  const response = await fetch(
    `https://gnews.io/api/v4/search?q=${query}&max=4&apikey=cec94c7088169094d912c683f4f45fac`
  );
  const data = await response.json();
  return data;
}

export const buildPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 1) return [1];
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  let prev = 0;
  sorted.forEach((pageNumber) => {
    if (prev !== 0 && pageNumber - prev > 1) {
      result.push("ellipsis");
    }
    result.push(pageNumber);
    prev = pageNumber;
  });
  return result;
};

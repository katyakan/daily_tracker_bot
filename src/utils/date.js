import dayjs from 'dayjs';

export const today = () => dayjs().format('YYYY-MM-DD');
export const dateNDaysAgo = (n) => dayjs().subtract(n, 'day').format('YYYY-MM-DD');
export const formatDate = (d) => dayjs(d).format('YYYY-MM-DD');
export const rangeDaysCount = (start, end) => {
  const s = dayjs(start), e = dayjs(end);
  return e.diff(s, 'day') + 1;
};
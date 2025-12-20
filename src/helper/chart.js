import Chart from 'chart.js/auto';

export const CHART_COLORS = [
  '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC'
];

export const OUTLIER_DATA_POINT_COLOR = '#FF0000';

export function getColorOfDataPoint(index) {
  return CHART_COLORS[index];
}

Chart.defaults.backgroundColor = function (context){
  return getColorOfDataPoint(context.dataIndex % CHART_COLORS.length);
}

export function generateCategoriesForChart(frequency, date) {
  let categories = [];

  switch (frequency) {
    case 'daily':
      if (/^[0-9]{4}\-[0-9]{2}$/.test(date)) {
        try {
          date = date.split('-');
          const firstDate = new Date(date[0], Number(date[1]) - 1, 1);
          const lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0);

          categories = Array.from({ length: lastDate.getDate() }, (_, i) => `${i + 1}`);
        } catch (error) {
          categories = [];
        }
      }
      break;
    
    case 'monthly':      
      categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      break;

    case "weekly":
      categories = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      break;

    default:
      categories = [];
  }

  return categories;
}

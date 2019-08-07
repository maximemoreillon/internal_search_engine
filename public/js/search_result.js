var app = new Vue({
  el: '#app',
  data: {
    records: records,
    query: query,
    record_types: [],
    filters: [],

  },
  created: function () {
    for (var i = 0; i < this.records.length; i++) {
      if(!this.record_types.includes(this.records[i]._fields[0].labels[0]) ) {
        this.record_types.push(this.records[i]._fields[0].labels[0]);

        // Filter in by default
        this.filters.push(this.records[i]._fields[0].labels[0]);
      }
    }

  },
})

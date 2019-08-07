var app = new Vue({
  el: '#app',
  data: {
    records: records,
    record_types: [],
    filters: [],
    query: query,

  },
  created: function () {
    for (var i = 0; i < this.records.length; i++) {
      if(!this.record_types.includes(this.records[i]._fields[2].labels[0]) ) {
        this.record_types.push(this.records[i]._fields[2].labels[0]);

        // Filter in by default
        this.filters.push(this.records[i]._fields[2].labels[0]);
      }
    }

  },
  methods: {
    relationship_class: function(record){
      var end = record._fields[1].end.low;
      if(end == this.query){
        return "inwards";
      }
      else {
        return "outwards";
      }


    }
  }
})

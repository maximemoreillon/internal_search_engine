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
  methods: {
    highlighted: function(property) {
      return property.toLowerCase().indexOf(query.toLowerCase()) != -1;
    },
    hidden_key: function(key){
      var hidden_keys = ['password_hashed'];
      return !(hidden_keys.includes(key));
    }
  }

})

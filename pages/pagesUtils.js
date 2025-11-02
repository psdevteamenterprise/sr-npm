function groupValuesByField(values, refKey) {
    const map = new Map();
    for (const v of values) {
      const ref = v[refKey]; // should be the _id of the CustomFields item
      if (!map.has(ref)) map.set(ref, []);
      map.get(ref).push({
        label: v.title ,
        value: v._id
      });
    }
    return map;
  }

  module.exports = {
    groupValuesByField,
}
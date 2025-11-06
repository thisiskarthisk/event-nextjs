export default function Validation(data, rulesList) {
  let errors = {};

  // console.log('Validation()');
  // console.log(data, rulesList);

  for (let fieldName in rulesList) {
    let ruleSet = rulesList[fieldName];
    let value = (data && fieldName in data ? data[fieldName] : '') || '';

    // console.log('typeof(ruleSet): ', typeof(ruleSet));

    if (ruleSet && typeof(ruleSet) === 'string') {
      ruleSet = ruleSet.split('|');
    }

    // console.log('fieldName:', fieldName);
    // console.log('value:', value);
    // console.log('ruleSet:', ruleSet);

    if (ruleSet) {
      for (let rule of ruleSet) {
        let invalid = false, message = '';

        switch (rule) {
          case 'required':
            if (!value) {
              invalid = true;
              message = 'Required';
            }
            break;
          case 'number':
            if (!(value && !isNaN(value))) {
              invalid = true;
              message = 'Invalid number';
            }
            break;
          case 'alpha_num':
            if (!(value && /^[a-zA-Z0-9\-\/]+$/.test(value))) {
              invalid = true;
              message = 'Invalid characters';
            }
            break;
          case 'email':
            if (!(value && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))) {
              invalid = true;
              message = 'Invalid email address';
            }
            break;
          case 'mobile_no':
            if (!(value && /^[0-9]{10}$/.test(value))) {
              invalid = true;
              message = 'Invalid mobile number';
            }
            break;
        }

        if (invalid) {
          errors[fieldName] = message;

          break;
        }
      }
    }
  }

  if (Object.keys(errors).length === 0) return null;

  return errors;
}

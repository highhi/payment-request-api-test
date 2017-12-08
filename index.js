(() => {
  if (!window.PaymentRequest) {
    console.log('PaymentRequest API is not available');
    return;
  }

  const supportedInstruments = [{
    supportedMethods: ['basic-card'],
    data: {
      supportedNetworks: ['visa', 'mastercard'],
    },
  }];
  
  function getDisplayItems(items) {
    return items
      .filter(item => item.checked)
      .map(item => ({
        label: item.dataset.itemName,
        amount: { currency: "JPY", value : item.value },
      })
    );
  }

  function getTotal(items) {
    const total = items
      .filter(item => item.checked)
      .reduce((acc, item) => acc + Number(item.value), 0);

    return {
      label: "Total",
      amount: { currency: "JPY", value : total },
    };
  }

  function timeout(request) {
    const paymentTimeout = setTimeout(() => {
      try {
        request.abort().then(() => {
          console.log('Payment timed out after 20 minutes.');
        });
      } catch(err) {
        console.log('Unable to abort.');
      } finally {
        clearTimeout(paymentTimeout);
      }
    }, 5000);
  }

  async function onClick() {
    const items = Array.from(document.querySelectorAll('.item'));

    if (!items.some(item => item.checked)) {
      return;
    }

    const details = {
      displayItems: getDisplayItems(items),
      total: getTotal(items),
      shippingOptions: [],
    };

    const shippingOptions = document.querySelector('#shipping-option').checked
      ? { requestShipping: true, shippingType: "shipping" }
      : null;

    const request = new PaymentRequest(supportedInstruments, details, shippingOptions);
    const paymentAvailable = await request.canMakePayment();

    // if (!paymentAvailable) {
    //   return;
    // }
    
    if (document.querySelector('#timeout-option').checked) {
      timeout(request);
    }
    
    request.show().then(result => {
      return fetch('/pay', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result.toJSON())
      }).then(response => {
        if (response.status === 200) {
          return result.complete('success');
        }
        return result.complete('fail');
      }).catch(() => {
        return result.complete('fail');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#buy').addEventListener('click', onClick);
  });
})();
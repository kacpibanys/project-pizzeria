import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAmountWidget();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.processOrder();

  }

  renderInMenu(){
    const thisProduct = this;

    /*generate HTML based on template */
    const genereatedHTML = templates.menuProduct(thisProduct.data);
    /* create element using utills.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(genereatedHTML);
    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    const productNameHTML = thisProduct.element.querySelector('.product__name');
    thisProduct.name = productNameHTML.getAttribute('data-name');
  }

  initAccordion(){
    const thisProduct = this;

    const header = thisProduct.element.querySelector(select.menuProduct.clickable);

    header.addEventListener('click', function(event) {
      event.preventDefault();
      const wasActive = thisProduct.element.classList.contains(classNames.menuProduct.wrapperActive);
      const activeProductList = document.querySelectorAll('.product.active');

      for(let product of activeProductList){
        product.classList.remove(classNames.menuProduct.wrapperActive);

      }

      wasActive ? thisProduct.element.classList.remove(classNames.menuProduct.wrapperActive): thisProduct.element.classList.add(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm(){
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();

    });
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
  }

  processOrder() {
    const thisProduct = this;

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);

    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        // check if there is param with a name of paramId in formData and if it includes optionId
        if(formData[paramId] && formData[paramId].includes(optionId)) {
          // check if the option is not default
          if(option != option.default) {
            // add option price to price variable

            price = price + option.price;
          }
        } else {
          // check if the option is default
          if(option == option.default) {
            // reduce price variable
            price = price - option.price;
          }
        }
        const imageClass = '.' + paramId + '-' + optionId;
        const optionImage = thisProduct.imageWrapper.querySelector(imageClass);
        if(optionImage){
          if(formData[paramId].includes(optionId)) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }

    // update calculated price in the HTML
    thisProduct.priceSingle;
    thisProduct.priceSingle = price;
    if(thisProduct.amountWidget){
      price *= thisProduct.amountWidget.value;
    }
    thisProduct.price = price;
    thisProduct.priceElem.innerHTML = price;

  }

  addToCart(){
    const thisProduct = this;
    // app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.price;
    productSummary.params = this.prepareCartProductParams(thisProduct);

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};

    // for very category (param)
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {}
      };

      // for every option in this category
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if(optionSelected) {
          // option is selected!
          params[paramId].options = option;
        }
      }
    }
    return params;
  }
}

export default Product;
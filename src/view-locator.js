import {metadata, Origin} from 'aurelia-metadata';
import {RelativeViewStrategy, ConventionalViewStrategy, viewStrategy} from './view-strategy';

/**
* Locates a view for an object.
*/
export class ViewLocator {
  /**
  * The metadata key for storing/finding view strategies associated with an class/object.
  */
  static viewStrategyMetadataKey = 'aurelia:view-strategy';

  /**
  * Gets the view strategy for the value.
  * @param value The value to locate the view strategy for.
  * @return The located ViewStrategy instance.
  */
  getViewStrategy(value: any): ViewStategy {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && 'getViewStrategy' in value) {
      let origin = Origin.get(value.constructor);

      value = value.getViewStrategy();

      if (typeof value === 'string') {
        value = new RelativeViewStrategy(value);
      }

      viewStategy.assert(value);

      if (origin) {
        value.makeRelativeTo(origin.moduleId);
      }

      return value;
    }

    if (typeof value === 'string') {
      value = new RelativeViewStrategy(value);
    }

    if (viewStrategy.validate(value)) {
      return value;
    }

    if (typeof value !== 'function') {
      value = value.constructor;
    }

    let origin = Origin.get(value);
    let strategy = metadata.get(ViewLocator.viewStrategyMetadataKey, value);

    if (!strategy) {
      if (!origin) {
        throw new Error('Cannot determinte default view strategy for object.', value);
      }

      strategy = this.createFallbackViewStrategy(origin);
    } else if (origin) {
      strategy.moduleId = origin.moduleId;
    }

    return strategy;
  }

  /**
  * Creates a fallback View Strategy. Used when unable to locate a configured strategy.
  * The default implementation returns and instance of ConventionalViewStrategy.
  * @param origin The origin of the view model to return the strategy for.
  * @return The fallback ViewStrategy.
  */
  createFallbackViewStrategy(origin: Origin): ViewStategy {
    return new ConventionalViewStrategy(this, origin);
  }

  /**
  * Conventionally converts a view model origin to a view url.
  * Used by the ConventionalViewStrategy.
  * @param origin The origin of the view model to convert.
  * @return The view url.
  */
  convertOriginToViewUrl(origin: Origin): string {
    let moduleId = origin.moduleId;
    let id = (moduleId.endsWith('.js') || moduleId.endsWith('.ts')) ? moduleId.substring(0, moduleId.length - 3) : moduleId;
    return id + '.html';
  }
}

System.register(["aurelia-loader", "aurelia-dependency-injection", "aurelia-metadata", "aurelia-binding", "./custom-element", "./attached-behavior", "./template-controller", "./view-engine"], function (_export) {
  "use strict";

  var Loader, Container, getAnnotation, addAnnotation, ResourceType, Origin, ValueConverter, CustomElement, AttachedBehavior, TemplateController, ViewEngine, _prototypeProperties, id, ResourceCoordinator, ResourceModule;


  function nextId() {
    return ++id;
  }

  function analyzeModule(moduleInstance, viewModelMember) {
    var viewModelType, fallback, annotation, key, exportedValue, resources = [], name, conventional;

    if (viewModelMember) {
      viewModelType = moduleInstance[viewModelMember];
    }

    for (key in moduleInstance) {
      exportedValue = moduleInstance[key];

      if (key === viewModelMember || typeof exportedValue !== "function") {
        continue;
      }

      annotation = getAnnotation(exportedValue, ResourceType);
      if (annotation) {
        if (!viewModelType && annotation instanceof CustomElement) {
          viewModelType = exportedValue;
        } else {
          resources.push({ type: annotation, value: exportedValue });
        }
      } else {
        name = exportedValue.name;

        if (conventional = CustomElement.convention(name)) {
          if (!viewModelType) {
            addAnnotation(exportedValue, conventional);
            viewModelType = exportedValue;
          } else {
            resources.push({ type: conventional, value: exportedValue });
          }
        } else if (conventional = AttachedBehavior.convention(name)) {
          resources.push({ type: conventional, value: exportedValue });
        } else if (conventional = TemplateController.convention(name)) {
          resources.push({ type: conventional, value: exportedValue });
        } else if (conventional = ValueConverter.convention(name)) {
          resources.push({ type: conventional, value: exportedValue });
        } else if (!fallback) {
          fallback = exportedValue;
        }
      }
    }

    viewModelType = viewModelType || fallback;

    return new ResourceModule(moduleInstance, viewModelType ? {
      value: viewModelType,
      type: getAnnotation(viewModelType, CustomElement) || new CustomElement()
    } : null, resources);
  }
  return {
    setters: [function (_aureliaLoader) {
      Loader = _aureliaLoader.Loader;
    }, function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }, function (_aureliaMetadata) {
      getAnnotation = _aureliaMetadata.getAnnotation;
      addAnnotation = _aureliaMetadata.addAnnotation;
      ResourceType = _aureliaMetadata.ResourceType;
      Origin = _aureliaMetadata.Origin;
    }, function (_aureliaBinding) {
      ValueConverter = _aureliaBinding.ValueConverter;
    }, function (_customElement) {
      CustomElement = _customElement.CustomElement;
    }, function (_attachedBehavior) {
      AttachedBehavior = _attachedBehavior.AttachedBehavior;
    }, function (_templateController) {
      TemplateController = _templateController.TemplateController;
    }, function (_viewEngine) {
      ViewEngine = _viewEngine.ViewEngine;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      id = 0;
      ResourceCoordinator = (function () {
        var ResourceCoordinator = function ResourceCoordinator(loader, container, viewEngine) {
          this.loader = loader;
          this.container = container;
          this.viewEngine = viewEngine;
          this.importedModules = {};
          this.importedAnonymous = {};
          viewEngine.resourceCoordinator = this;
        };

        _prototypeProperties(ResourceCoordinator, {
          inject: {
            value: function () {
              return [Loader, Container, ViewEngine];
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        }, {
          getExistingModuleAnalysis: {
            value: function (id) {
              return this.importedModules[id] || this.importedAnonymous[id];
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          loadViewModelInfo: {
            value: function (moduleImport, moduleMember) {
              return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedAnonymous);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          loadElement: {
            value: function (moduleImport, moduleMember, viewStategy) {
              var _this = this;
              return this._loadAndAnalyzeModuleForElement(moduleImport, moduleMember, this.importedModules).then(function (info) {
                var type = info.type;

                if (type.isLoaded) {
                  return type;
                }

                type.isLoaded = true;

                return type.load(_this.container, info.value, viewStategy);
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          _loadAndAnalyzeModuleForElement: {
            value: function (moduleImport, moduleMember, cache) {
              var _this2 = this;
              var existing = cache[moduleImport];

              if (existing) {
                return Promise.resolve(existing.element);
              }

              return this.loader.loadModule(moduleImport).then(function (elementModule) {
                var analysis = analyzeModule(elementModule, moduleMember), resources = analysis.resources, container = _this2.container, loads = [], type, current, i, ii;

                if (!analysis.element) {
                  throw new Error("No element found in module \"" + moduleImport + "\".");
                }

                for (i = 0, ii = resources.length; i < ii; ++i) {
                  current = resources[i];
                  type = current.type;

                  if (!type.isLoaded) {
                    type.isLoaded = true;
                    loads.push(type.load(container, current.value));
                  }
                }

                cache[analysis.id] = analysis;

                return Promise.all(loads).then(function () {
                  return analysis.element;
                });
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          importResources: {
            value: function (imports) {
              var i, ii, current, annotation, existing, lookup = {}, finalModules = [], importIds = [];

              for (i = 0, ii = imports.length; i < ii; ++i) {
                current = imports[i];
                annotation = Origin.get(current);
                existing = lookup[annotation.moduleId];

                if (!existing) {
                  existing = {};
                  importIds.push(annotation.moduleId);
                  finalModules.push(existing);
                  lookup[annotation.moduleId] = existing;
                }

                existing[nextId()] = current;
              }

              return this.importResourcesFromModules(finalModules, importIds);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          importResourcesFromModuleIds: {
            value: function (importIds) {
              var _this3 = this;
              return this.loader.loadAllModules(importIds).then(function (imports) {
                return _this3.importResourcesFromModules(imports, importIds);
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          importResourcesFromModules: {
            value: function (imports, importIds) {
              var loads = [], i, ii, analysis, type, key, annotation, j, jj, resources, current, existing = this.importedModules, container = this.container, allAnalysis = new Array(imports.length);

              if (!importIds) {
                importIds = new Array(imports.length);

                for (i = 0, ii = imports.length; i < ii; ++i) {
                  current = imports[i];

                  for (key in current) {
                    type = current[key];
                    annotation = Origin.get(type);
                    if (annotation) {
                      importIds[i] = annotation.moduleId;
                      break;
                    }
                  }
                }
              }

              for (i = 0, ii = imports.length; i < ii; ++i) {
                analysis = existing[importIds[i]];

                if (analysis) {
                  allAnalysis[i] = analysis;
                  continue;
                }

                analysis = analyzeModule(imports[i]);
                existing[analysis.id] = analysis;
                allAnalysis[i] = analysis;
                resources = analysis.resources;

                for (j = 0, jj = resources.length; j < jj; ++j) {
                  current = resources[j];
                  type = current.type;

                  if (!type.isLoaded) {
                    type.isLoaded = true;
                    loads.push(type.load(container, current.value));
                  }
                }

                if (analysis.element) {
                  type = analysis.element.type;

                  if (!type.isLoaded) {
                    type.isLoaded = true;
                    loads.push(type.load(container, analysis.element.value));
                  }
                }
              }

              return Promise.all(loads).then(function () {
                return allAnalysis;
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return ResourceCoordinator;
      })();
      _export("ResourceCoordinator", ResourceCoordinator);

      ResourceModule = (function () {
        var ResourceModule = function ResourceModule(source, element, resources) {
          var i, ii;

          this.source = source;
          this.element = element;
          this.resources = resources;

          if (element) {
            this.id = Origin.get(element.value).moduleId;
          } else if (resources.length) {
            this.id = Origin.get(resources[0].value).moduleId;
          }
        };

        _prototypeProperties(ResourceModule, null, {
          register: {
            value: function (registry, name) {
              var i, ii, resources = this.resources;

              if (this.element) {
                this.element.type.register(registry, name);
                name = null;
              }

              for (i = 0, ii = resources.length; i < ii; ++i) {
                resources[i].type.register(registry, name);
                name = null;
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return ResourceModule;
      })();
    }
  };
});
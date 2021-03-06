'use strict';

define([
    'jquery',
    'modules/default/defaultview',
    'jsgraph',
    'json-chart',
    'src/util/datatraversing',
    'src/util/api',
    'src/util/color',
    'src/util/debug'
], function ($, Default, Graph, JSONChart, DataTraversing, API, Color, Debug) {

    const defaultScatterStyle = {
        shape: 'circle',
        cx: 0,
        cy: 0,
        r: 3,
        height: '5px',
        width: '5px',
        stroke: 'transparent',
        fill: 'black'
    };

    const fullOutMap = {
        x: 'xAxis',
        y: 'yAxis',
        xy: 'both'
    };

    const svgDoctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    function View() {
    }

    $.extend(true, View.prototype, Default, {

        init() {
            this.series = {};
            this.seriesDrawn = {};
            this.annotations = {};
            this.dom = $('<div />');
            this.module.getDomContent().html(this.dom);
            this.seriesActions = [];

            this.colorId = 0;
            this.colors = ['red', 'blue', 'green', 'black'];

            this.deferreds = {};
            this.onchanges = {};
        },

        inDom() {
            var prom = new Promise(resolve => {

                var cfg = this.cfg = this.module.getConfiguration.bind(this.module);
                var cfgCheckbox = this.cfgCheckbox = this.module.getConfigurationCheckbox.bind(this.module);
                var graphurl = cfg('graphurl');

                if (graphurl) {
                    $.getJSON(graphurl, {}, data => {
                        data.options.onMouseMoveData = (e, val) => {
                            this.module.controller.sendAction('mousetrack', val);
                        };

                        resolve(new Graph(this.dom.get(0), data.options, data.axis));
                    });
                } else {

                    var options = {
                        close: {
                            top: false,
                            right: false,
                            bottom: false,
                            left: false
                        },
                        plugins: {},
                        mouseActions: []
                    };

                    var zoom = cfg('zoom');
                    if (zoom && zoom !== 'none') {
                        var zoomOptions = {};
                        if (zoom === 'x') {
                            zoomOptions.zoomMode = 'x';
                        } else if (zoom === 'y') {
                            zoomOptions.zoomMode = 'y';
                        } else {
                            zoomOptions.zoomMode = 'xy';
                        }
                        if (cfgCheckbox('independantYZoom', 'yes')) {
                            zoomOptions.axes = 'serieSelected';
                        }
                        options.plugins['zoom'] = zoomOptions;
                        options.plugins['drag'] = {};
                        options.mouseActions.push({
                            plugin: 'zoom',
                            shift: false,
                            ctrl: false
                        });
                        options.mouseActions.push({
                            plugin: 'drag',
                            shift: true,
                            ctrl: false
                        });
                        options.mouseActions.push({
                            plugin: 'zoom',
                            type: 'dblclick',
                            options: {
                                mode: 'total'
                            }
                        });
                        options.mouseActions.push({
                            plugin: 'zoom',
                            type: 'dblclick',
                            shift: true,
                            options: {
                                mode: 'gradualXY'
                            }
                        });
                    }

                    var wheel = cfg('wheelAction');
                    if (wheel && wheel !== 'none') {
                        var wheelOptions = {
                            baseline: cfg('wheelbaseline', 0)
                        };

                        if (wheel === 'xAxis') {
                            wheelOptions.direction = 'x';
                        } else {
                            wheelOptions.direction = 'y';
                        }

                        options.mouseActions.push({
                            plugin: 'zoom',
                            type: 'mousewheel',
                            options: wheelOptions
                        });

                        if (!options.plugins.zoom) {
                            options.plugins.zoom = {};
                        }
                    }

                    const useMouseTracking = cfgCheckbox('mouseTracking', 'track');
                    if (useMouseTracking) {
                        options.onMouseMoveData = (event, result) => {
                            this.module.model.trackData = result;
                            this.module.controller.sendActionFromEvent('onTrackMouse', 'trackData', result);
                            this.module.controller.createDataFromEvent('onTrackMouse', 'trackData', result);
                        };
                    }

                    const selectScatterPlugin = cfgCheckbox('selectScatter', 'yes');
                    if (selectScatterPlugin) {
                        options.plugins.selectScatter = {};
                        options.mouseActions.push({
                            plugin: 'selectScatter',
                            alt: true
                        });
                    }

                    var graph = new Graph(this.dom.get(0), options);
                    this.graph = graph;

                    if (useMouseTracking) {
                        graph.on('click', () => {
                            if (this.module.model.trackData) {
                                this.module.controller.sendActionFromEvent('onTrackClick', 'trackData', this.module.model.trackData);
                                this.module.controller.createDataFromEvent('onTrackClick', 'trackData', this.module.model.trackData);
                            }
                        });
                    }

                    if (selectScatterPlugin) {
                        var plugin = graph.getPlugin('selectScatter');
                        plugin.on('selectionEnd', selectedIndices => {
                            const serie = plugin.serie;
                            var result = [];
                            var info = serie.infos;
                            if (info) {
                                result = selectedIndices.map(index => info[index]);
                            }
                            this.module.controller.onScatterSelection(result);
                        });
                    }

                    var xOptions = {
                        nbTicksPrimary: cfg('xnbTicksPrimary', 5)
                    };

                    if (cfg('xaxismodification') == 'timestamptotime') {
                        xOptions.type = 'time';
                    } else if (cfg('xaxismodification') == 'valtotime') {
                        xOptions.unitModification = 'time';
                    } else if (cfg('xaxismodification') == 'valtotime:min.sec') {
                        xOptions.unitModification = 'time:min.sec';
                    }

                    // Axes
                    var xAxis = graph.getXAxis(0, xOptions);
                    this.xAxis = xAxis;
                    xAxis
                        .flip(cfg('flipX', false))
                        .setPrimaryGrid(cfg('vertGridMain', false))
                        .setSecondaryGrid(cfg('vertGridSec', false))
                        .setPrimaryGridColor('#DADADA')
                        .setSecondaryGridColor('#F0F0F0')
                        .setGridLinesStyle() // Force redrawing the grid lines (see https://github.com/NPellet/visualizer/issues/766#issuecomment-172378003)
                        .setLabel(cfg('xLabel', ''))
                        .forceMin(cfg('minX', false))
                        .forceMax(cfg('maxX', false))
                        .setAxisDataSpacing(cfg('xLeftSpacing', 0), cfg('xRightSpacing', 0));
                    if (!cfg('displayXAxis', true)) {
                        xAxis.hide();
                    }
                    const xZoomHandler = ([min, max]) => {
                        this.module.model.setXBoundaries(min, max);
                    };
                    xAxis.on('zoom', xZoomHandler).on('zoomOutFull', xZoomHandler);
                    if (cfgCheckbox('FitYToAxisOnFromTo', 'rescale')) {
                        xAxis.on('zoom', function () {
                            yAxis.scaleToFitAxis(this);
                        });
                    }

                    this.numberOfYAxes = 0;
                    var yAxis = this.getYAxis(0);
                    this.yAxis = yAxis;

                    var legend = cfg('legend', 'none');
                    if (legend !== 'none') {
                        var theLegend = graph.makeLegend({
                            backgroundColor: 'rgba( 255, 255, 255, 0.8 )',
                            frame: true,
                            frameWidth: '1',
                            frameColor: 'rgba( 100, 100, 100, 0.5 )',
                            movable: cfgCheckbox('legendOptions', 'movable'),
                            isSerieHideable: cfgCheckbox('legendOptions', 'isSerieHideable'),
                            isSerieSelectable: cfgCheckbox('legendOptions', 'isSerieSelectable')
                        });
                        theLegend.setAutoPosition(legend);
                    }

                    resolve(graph);

                }

            });

            prom.then(graph => {
                this.graph = graph;
                this.xAxis = graph.getXAxis(0);
                this.yAxis = graph.getYAxis(0);

                graph.on('shapeMouseOver', shape => {
                    this.module.controller.createDataFromEvent('onMouseOverShape', 'shapeProperties', shape.getProperties());
                    this.module.controller.createDataFromEvent('onMouseOverShape', 'shapeInfos', shape.getData());
                    API.highlight(shape.getData(), 1);
                });

                graph.on('shapeMouseOut', shape => {
                    API.highlight(shape.getData(), 0);
                });

                graph.on('shapeResized', shape => {
                    this.module.model.dataTriggerChange(shape.getData());
                });

                graph.on('shapeSelected', shape => {
                    this.module.controller.createDataFromEvent('onShapeClick', 'shapeProperties', shape.getProperties());
                    this.module.controller.createDataFromEvent('onShapeClick', 'shapeInfos', shape.getData());
                    this.module.controller.sendActionFromEvent('onShapeSelect', 'selectedShape', shape.getData());
                });
                graph.on('shapeUnselected', shape => {
                    this.module.controller.createDataFromEvent('onShapeClick', 'shapeProperties', shape.getProperties());
                    this.module.controller.createDataFromEvent('onShapeClick', 'shapeInfos', shape.getData());
                    this.module.controller.sendActionFromEvent('onShapeUnselect', 'shapeInfos', shape.getData());
                });

                this.onResize();
                this.resolveReady();

            }).catch(err => {
                Debug.error('Error loading the graph', err);
            });

        },

        getYAxis(index) {
            if (this.numberOfYAxes > index) {
                return this.graph.getYAxis(index);
            }

            var cfg = this.cfg;

            var yAxis;
            for (var i = this.numberOfYAxes; i <= index; i++) {
                var yOptions = {
                    nbTicksPrimary: cfg('ynbTicksPrimary', 5)
                };
                yAxis = this.graph.getYAxis(i, yOptions);
                if (i === 0) {
                    yAxis
                        .setPrimaryGrid(cfg('horGridMain', false))
                        .setSecondaryGrid(cfg('horGridSec', false))
                        .setPrimaryGridColor('#DADADA')
                        .setSecondaryGridColor('#F0F0F0')
                        .setGridLinesStyle()
                        .setLabel(cfg('yLabel', ''));
                    if (!cfg('displayYAxis', true)) {
                        yAxis.hide();
                    }
                    const yZoomHandler = ([min, max]) => {
                        this.module.model.setYBoundaries(min, max);
                    };
                    yAxis.on('zoom', yZoomHandler).on('zoomOutFull', yZoomHandler);
                } else {
                    yAxis
                        .setPrimaryGrid(false)
                        .setSecondaryGrid(false)
                        .setGridLinesStyle()
                        .hide();
                }
                yAxis
                    .flip(cfg('flipY', false))
                    .forceMin(cfg('minY', false))
                    .forceMax(cfg('maxY', false))
                    .setAxisDataSpacing(cfg('yBottomSpacing', 0), cfg('yTopSpacing', 0));

                this.numberOfYAxes++;
            }

            return yAxis;
        },

        onResize() {
            if (!this.graph) {
                return;
            }
            this.graph.resize(this.width, this.height);
        },

        shouldAutoscale(varName) {
            if (this.seriesDrawn[varName]) {
                return false;
            } else {
                this.seriesDrawn[varName] = true;
                return true;
            }
        },

        redraw(forceReacalculateAxis, varName) {
            var fullOut;
            if (forceReacalculateAxis) {
                fullOut = 'both';
            } else {
                fullOut = this.module.getConfiguration('fullOut');
                if (varName && fullOut === 'once') {
                    if (!this.shouldAutoscale(varName)) {
                        fullOut = 'none';
                    } else {
                        fullOut = 'both';
                    }
                }
            }

            this.fullOut(fullOut);
        },

        fullOut(type) {
            switch (type) {
                case 'both':
                    this.graph.autoscaleAxes();
                    break;
                case 'xAxis':
                    this.xAxis.setMinMaxToFitSeries();
                    break;
                case 'yAxis':
                    this.yAxis.setMinMaxToFitSeries();
                    break;
            }

            this.graph.draw();

            var minX = this.xAxis.getCurrentMin();
            var maxX = this.xAxis.getCurrentMax();
            var minY = this.yAxis.getCurrentMin();
            var maxY = this.yAxis.getCurrentMax();

            this.module.model.setXBoundaries(minX, maxX);
            this.module.model.setYBoundaries(minY, maxY);
        },

        getSerieOptions(varname, highlight, data) {
            var plotinfos = this.module.getConfiguration('plotinfos');

            highlight = highlight || [];

            var options = {
                trackMouse: true
            };

            if (plotinfos) {
                for (var i = 0, l = plotinfos.length; i < l; i++) {
                    if (varname == plotinfos[i].variable) {

                        var continuous = plotinfos[i].plotcontinuous;
                        if (continuous === 'auto') {
                            continuous = analyzeContinuous(data);
                        }

                        if (plotinfos[i].markers[0]) {
                            options.markersIndependant = true;
                        }

                        options.lineToZero = continuous == 'discrete';
                        options.useSlots = (plotinfos[i].optimizeSlots ? !!plotinfos[i].optimizeSlots[0] : false);
                        options.strokeWidth = parseInt(plotinfos[i].strokewidth);

                        var pp = plotinfos[i].peakpicking[0];
                        if (pp) {
                            if (options.lineToZero) {
                                options.autoPeakPicking = true;
                            } else {
                                options.autoPeakPicking = 'continuous';
                            }
                        }
                    }
                }
            }


            // 3 June 2014, Norman
            // Ok here for instance we have a problem. The data generated by the graph is NOT in another variable
            // Therefore we create this data from scratch. Easy.
            options.onMouseOverMarker = (index, infos, xy) => {
                API.highlightId(highlight[index[0]], 1);
                this.module.controller.onMouseOverMarker(xy, infos);
            };
            options.onMouseOutMarker = (index, infos, xy) => {
                API.highlightId(highlight[index[0]], 0);
                this.module.controller.onMouseOutMarker(xy, infos);
            };
            options.onToggleMarker = (xy, infos, toggledOn) => {
                this.module.controller.onClickMarker(xy, infos, toggledOn);
            };

            return options;

        },

        setSerieParameters(serie, varname, highlight, forceColor) {

            serie.setXAxis(0);

            var plotinfos = this.module.getConfiguration('plotinfos');

            var foundInfo = false;
            if (plotinfos) {
                for (var i = 0, l = plotinfos.length; i < l; i++) {
                    if (varname == plotinfos[i].variable) {
                        foundInfo = true;
                        var axis = this.getYAxis(plotinfos[i].axis ? Number(plotinfos[i].axis) : 0);
                        serie.setYAxis(axis);

                        if (plotinfos[i].adaptTo && String(plotinfos[i].adaptTo) !== 'none') {
                            var other = this.getYAxis(Number(plotinfos[i].adaptTo));
                            axis.adaptTo(other, 0, 0);
                        }

                        var color = forceColor ? forceColor : plotinfos[i].plotcolor;

                        serie.setLineColor(Color.getColor(color), false, true);

                        var lineWidth = parseFloat(plotinfos[i].strokewidth);
                        if (isNaN(lineWidth)) lineWidth = 1;

                        serie.setLineWidth(lineWidth);
                        serie.setLineStyle(parseInt(plotinfos[i].strokestyle) || 1, false, true);

                        if (plotinfos[i].markers[0] && serie.showMarkers) {
                            serie.showMarkers();
                            serie.setMarkers([{
                                type: parseInt(plotinfos[i].markerShape),
                                zoom: plotinfos[i].markerSize,
                                strokeColor: Color.getColor(color),
                                fillColor: Color.getColor(color),
                                points: 'all'
                            }]);
                        }

                        if (plotinfos[i].monotoneous && plotinfos[i].monotoneous[0]) {
                            serie.XIsMonotoneous();
                        }

                        if (plotinfos[i].degrade) {
                            serie.degrade(plotinfos[i].degrade);
                        }

                        if (plotinfos[i].tracking && plotinfos[i].tracking[0] === 'yes') {
                            serie.allowTrackingLine({});
                        }
                    }
                }
            }

            if (!foundInfo) {
                serie.setYAxis(this.getYAxis(0));
            }

            if (highlight) {
                API.listenHighlight({_highlight: highlight}, (value, commonKeys) => {
                    for (var i = 0, ii = commonKeys.length; i < ii; i++) {
                        var key = commonKeys[i];
                        for (var j = 0, jj = highlight.length; j < jj; j++) {
                            var high = highlight[j];
                            if (Array.isArray(high)) {
                                for (var k = 0; k < high.length; k++) {
                                    if (high[k] == key) {
                                        serie.toggleMarker([j, 0], !!value, true);
                                    }
                                }
                            } else if (high == key) {
                                serie.toggleMarker([j, 0], !!value, true);
                            }
                        }
                    }
                }, false, this.module.getId());
            }
        },

        blank: {
            xyArray(varName) {
                this.removeSerie(varName);
            },

            xArray(varName) {
                this.removeSerie(varName);
            },

            series_xy1d(varName) {
                this.removeSerie(varName);
            },

            jcamp(varName) {
                this.removeSerie(varName);
            },

            chart(varName) {
                this.removeSerie(varName);
            },

            annotations(varName) {
                this.removeAnnotations(varName);
            }
        },

        update: {
            chart(moduleValue, varname) {
                this.series[varname] = this.series[varname] || [];
                this.removeSerie(varname);

                moduleValue = JSONChart.check(moduleValue.get());
                var existingNames = new Set();

                var data = moduleValue.data;
                for (let i = 0; i < data.length; i++) {

                    var aData = data[i];

                    if (i === 0 && moduleValue.axis) {
                        if (moduleValue.axis[aData.xAxis]) {
                            this.xAxis.setLabel(moduleValue.axis[aData.xAxis].label);
                        }
                        if (moduleValue.axis[aData.yAxis]) {
                            this.yAxis.setLabel(moduleValue.axis[aData.yAxis].label);
                        }
                    }


                    var defaultStyle = aData.defaultStyle || {};
                    var serieName = varname;
                    if (existingNames.has(serieName)) {
                        serieName += '-' + i;
                    }
                    existingNames.add(serieName);

                    var serieLabel = aData.label || serieName;

                    var valFinal = [];

                    switch (String(aData.type)) {
                        case 'zone':
                            if (aData.yMin && aData.yMax) {
                                for (var j = 0, l = aData.yMax.length; j < l; j++) {
                                    valFinal.push(aData.x ? aData.x[j] : j);
                                    valFinal.push(aData.yMin[j], aData.yMax[j]);
                                }
                            }
                            break;
                        case 'contour':
                            valFinal = aData.contourLines;
                            break;
                        default:
                            if (aData.y) {
                                for (var j = 0, l = aData.y.length; j < l; j++) {
                                    valFinal.push(aData.x ? aData.x[j] : j);
                                    valFinal.push(aData.y[j]);
                                }
                            }
                            break;
                    }

                    var serieType = aData.type;
                    var hasColor = false;
                    if (!serieType && Array.isArray(aData.color)) {
                        hasColor = true;
                        serieType = 'line.color';
                    }
                    var serie = this.graph.newSerie(serieName, this.getSerieOptions(varname, aData._highlight, valFinal), serieType);

                    serie.setLabel(serieLabel);

                    this.normalize(valFinal, varname);
                    serie.setData(valFinal);

                    if (hasColor) {
                        let colors = aData.color;
                        if (!Array.isArray(colors)) {
                            throw new Error('Serie colors must be an array');
                        }
                        if (!Array.isArray(colors[0])) {
                            colors = [colors];
                        }
                        serie.setColors(colors);
                    }

                    if (aData.info) {
                        serie.infos = aData.info;
                    }

                    serie.autoAxis();
                    if (String(aData.type) === 'scatter') {
                        serie.setStyle(Object.assign({}, defaultScatterStyle, defaultStyle), aData.style);
                        if (this.module.getConfigurationCheckbox('selectScatter', 'yes')) {
                            var plugin = this.graph.getPlugin('selectScatter');
                            plugin.setSerie(serie);
                        }
                    } else {
                        var color = defaultStyle.lineColor || (data.length > 1 ? Color.getNextColorRGB(i, data.length) : null);
                        this.setSerieParameters(serie, varname, aData._highlight, color);
                    }

                    this.series[varname].push(serie);
                }

                this.redraw(false, varname);
            },

            xyArray(moduleValue, varname) {
                this.series[varname] = this.series[varname] || [];
                this.removeSerie(varname);

                if (!moduleValue) {
                    return;
                }

                var val = moduleValue.get();

                var serie = this.graph.newSerie(varname, this.getSerieOptions(varname, null, val));

                this.normalize(val, varname);
                serie.setData(val);
                this.setSerieParameters(serie, varname);

                this.series[varname].push(serie);
                this.redraw(false, varname);
            },

// in fact it is a Y array ...
            xArray(moduleValue, varname) {
                var val = moduleValue.get();
                this.series[varname] = this.series[varname] || [];
                this.removeSerie(varname);

                var minX = this.module.getConfiguration('minX', 0);
                var maxX = this.module.getConfiguration('maxX', val.length - 1);
                var step = (maxX - minX) / (val.length - 1);
                var val2 = [];
                for (var i = 0, l = val.length; i < l; i++) {
                    val2.push(minX + step * i);
                    val2.push(val[i]);
                }

                var serie = this.graph.newSerie(varname, this.getSerieOptions(varname, null, val2));

                this.normalize(val2, varname);

                serie.setData(val2);
                this.setSerieParameters(serie, varname);
                this.series[varname].push(serie);
                this.redraw(false, varname);
            },

            annotations(value, varName) {
                this.annotations[varName] = this.annotations[varName] || [];
                const annotations = value.get();
                for (let i = 0; i < annotations.length; i++) {
                    let annotation = annotations[i];
                    let shape = this.graph.newShape(String(annotation.type), annotation);
                    this.annotations[varName][i] = shape;

                    shape.autoAxes();

                    API.listenHighlight(annotation, onOff => {
                        if (onOff) {
                            shape.highlight({
                                fill: 'black'
                            });
                        } else {
                            shape.unHighlight();
                        }
                    }, false, this.module.getId() + varName);

                    this.module.model.dataListenChange(annotations.traceSync([i]), v => {
                        shape.redraw();
                    }, 'annotations');

                    shape.draw();
                    shape.redraw();
                }
            },

            jcamp(moduleValue, varname) {
                var that = this;
                var serie;

                if (!this.graph) {
                    return;
                }

                if (this.deferreds[varname]) {
                    this.deferreds[varname].reject();
                }

                this.deferreds[varname] = $.Deferred();
                var def = this.deferreds[varname];

                var options = moduleValue._options || {};

                var value = moduleValue.get();
                var valueType = DataObject.getType(value);
                if (valueType === 'string') {
                    require(['jcampconverter'], JcampConverter => {
                        JcampConverter.convert(String(value), options, true).then(displaySpectra);
                    });
                } else {
                    displaySpectra(value);
                }

                function displaySpectra(spectra) {
                    if (def.state() == 'rejected') {
                        return;
                    }

                    that.deferreds[varname] = false;
                    that.series[varname] = that.series[varname] || [];
                    that.series[varname] = [];

                    if (spectra.contourLines) {
                        serie = that.graph.newSerie(varname, that.getSerieOptions(varname), 'contour');

                        serie.setData(spectra.contourLines);
                        that.setSerieParameters(serie, varname);
                        that.series[varname].push(serie);
                    } else {
                        spectra = spectra.spectra;
                        for (var i = 0, l = spectra.length; i < l; i++) {
                            var data = spectra[i].data[spectra[i].data.length - 1];

                            serie = that.graph.newSerie(varname, that.getSerieOptions(varname, null, data));

                            that.normalize(data, varname);
                            serie.setData(data);
                            that.setSerieParameters(serie, varname);
                            that.series[varname].push(serie);
                            break;
                        }
                    }
                    that.redraw(false, varname);
                }
            },

            series_xy1d(data, varname) { // Receives an array of series. Blank the other ones.
                require(['src/util/color'], Color => {

                    var colors = Color.getDistinctColors(data.length);
                    //   self.graph.removeSeries();

                    //data = data.get();

                    var i = 0,
                        l = data.length;

                    for (; i < l; i++) {

                        var opts = this.getSerieOptions(varname, null, data[i].data);

                        var serie = this.graph.newSerie(data[i].name, opts);


                        serie.autoAxis();
                        this.series[varname].push(serie);

                        if (data[i].data) {
                            serie.setData(data[i].data);
                        }

                        //	serie.setLabel( data[ i ].label.toString( ) );
                        serie.setLineWidth(data[i].lineWidth || opts.strokeWidth || 1);
                        serie.setLineColor(data[i].lineColor || 'rgb(' + colors[i].join() + ')', false, true);
                        serie.setLineWidth(3, 'selected');
                        serie.extendStyles();
                    }

                    this.redraw();
                });
            }
        },

        setOnChange(id, varname, obj) {
            if (this.onchanges[varname]) {
                this.onchanges[varname].obj.unbindChange(this.onchanges[varname].id);
            }

            this.onchanges[varname] = {obj: obj, id: id};
        },

        removeAnnotations(varName) {
            API.killHighlight(this.module.getId() + varName);
            if (this.annotations[varName]) {
                for (var i = 0; i < this.annotations[varName].length; i++) {
                    this.annotations[varName][i].kill();
                }
            }
            this.annotations[varName] = [];
        },

        removeSerie(serieName) {
            if (this.series[serieName]) {
                for (var i = 0; i < this.series[serieName].length; i++) {
                    this.series[serieName][i].kill(true);
                }
            }

            this.series[serieName] = [];
        },

        makeSerie(data, value, name) {
            var serie = this.graph.newSerie(data.name);

            data.onChange(() => {
                serie.setData(data.data);
                this.graph.draw();
            });

            this.onActionReceive.removeSerieByName.call(this, data.name || {});
            serie.setData(data.data);

            this.seriesActions.push([value, serie, data.name]);
            this.setSerieParameters(serie, name);

            if (data.lineColor) {
                serie.setLineColor(data.lineColor, false, true);
            }

            if (data.lineWidth) {
                serie.setLineWidth(data.lineWidth);
            }

            this.redraw();
        },

        onActionReceive: {
            fromToX(value) {
                this.xAxis.zoom(value.from, value.to);
                this.graph.draw();
            },

            fromToY(value) {
                this.yAxis.zoom(value.from, value.to);
                this.graph.draw();
            },

            addSerie(value) {
                this.colorId++;

                if (value.name) {
                    this.makeSerie(value, value, value.name);
                } else {

                    for (var i in value) {
                        this.makeSerie(value[i], value);
                    }
                }
            },

            removeSerie(value) {
                for (var i = 0, l = this.seriesActions.length; i < l; i++) {
                    if (this.seriesActions[i][0] == value) {
                        this.seriesActions[i][1].kill();
                        this.seriesActions.splice(i, 1);
                    }
                }
            },

            removeSerieByName(value) {
                for (var i = 0; i < this.seriesActions.length; i++) {
                    if (this.seriesActions[i][2] == value) {
                        this.seriesActions[i][1].kill();
                        this.seriesActions.splice(i, 1);
                        i--;
                    }
                }
            },

            selectSerie(serieName) {
                var s = this.graph.getSerie(serieName.valueOf());

                if (s) {
                    s.select('selected');
                }
            },

            unselectSerie(serieName) {
                var s = this.graph.getSerie(serieName.valueOf());

                if (s) {
                    s.unselect();
                }
            },

            fullOut(value) {
                this.fullOut(fullOutMap[String(value)]);
            },

            exportSVG() {
                this.doSVGExport();
            }
        },

        doSVGExport() {
            var svgStr = this.getSVGString();
            if (svgStr) {
                this.module.controller.exportSVG(svgStr);
            }
        },

        getSVGString() {
            var svg = this.dom.find('svg');
            if (svg.length === 0) return;
            var serializer = new XMLSerializer();
            return svgDoctype + serializer.serializeToString(svg[0]);
        },

        normalize(array, varname) {
            var plotinfos = this.module.getConfiguration('plotinfos');
            var maxValue, minValue, total, ratio, i, l;

            if (!plotinfos) return;
            var normalize = '';
            for (i = 0, l = plotinfos.length; i < l; i++) {
                if (varname == plotinfos[i].variable) {
                    normalize = plotinfos[i].normalize;
                }
            }
            if (!normalize) return;

            if (Array.isArray(array[0])) { // Normalize from [[x1,y1],[x2,y2]]
                if (normalize == 'max1' || normalize == 'max100') {
                    var factor = 1;
                    if (normalize == 'max100') factor = 100;
                    maxValue = -Infinity;
                    for (i = 0; i < array.length; i++) {
                        if (array[i][1] > maxValue) maxValue = array[i][1];
                    }
                    for (i = 0; i < array.length; i++) {
                        array[i][1] /= maxValue / factor;
                    }
                } else if (normalize == 'sum1') {
                    total = 0;
                    for (i = 0; i < array.length; i++) {
                        total += array[i][1];
                    }
                    for (i = 0; i < array.length; i++) {
                        array[i][1] /= total;
                    }
                } else if (normalize == 'max1min0') {
                    maxValue = -Infinity;
                    minValue = Infinity;
                    for (i = 0; i < array.length; i++) {
                        if (array[i][1] > maxValue) maxValue = array[i][1];
                        if (array[i][1] < minValue) minValue = array[i][1];
                    }
                    ratio = 1 / (maxValue - minValue);
                    for (i = 0; i < array.length; i++) {
                        array[i][1] = (array[i][1] - minValue) * ratio;
                    }
                }
            } else { // Normalize from [x1,y1,x2,y2]
                if (normalize == 'max1' || normalize == 'max100') {
                    var factor = 1;
                    if (normalize == 'max100') factor = 100;
                    maxValue = -Infinity;
                    for (i = 1; i < array.length; i = i + 2) {
                        if (array[i] > maxValue) maxValue = array[i];
                    }
                    for (i = 1; i < array.length; i = i + 2) {
                        array[i] /= maxValue / factor;
                    }
                } else if (normalize == 'sum1') {
                    total = 0;
                    for (i = 1; i < array.length; i = i + 2) {
                        total += array[i];
                    }
                    for (i = 1; i < array.length; i = i + 2) {
                        array[i] /= total;
                    }
                } else if (normalize == 'max1min0') {
                    maxValue = -Infinity;
                    minValue = Infinity;
                    for (i = 1; i < array.length; i = i + 2) {
                        if (array[i] > maxValue) maxValue = array[i];
                        if (array[i] < minValue) minValue = array[i];
                    }
                    ratio = 1 / (maxValue - minValue);
                    for (i = 1; i < array.length; i = i + 2) {
                        array[i] = (array[i] - minValue) * ratio;
                    }
                }
            }
        }
    });

    function analyzeContinuous(data) {
        if (Array.isArray(data)) {
            var minInterval = Infinity;
            var maxInterval = -Infinity;
            var interval, i, ii;
            var MIN_FOR_CONTINUOUS = 20;
            if (typeof data[0] === 'number') {
                if (data.length < (MIN_FOR_CONTINUOUS * 2 - 1)) return 'discrete';
                for (i = 0, ii = data.length - 2; i < ii; i += 2) {
                    interval = data[i + 2] - data[i];
                    if (interval > maxInterval) maxInterval = interval;
                    if (interval < minInterval) minInterval = interval;
                }
            } else {
                if (data.length < MIN_FOR_CONTINUOUS) return 'discrete';
                for (i = 0, ii = data.length - 1; i < ii; i++) {
                    interval = data[i + 1][0] - data[i][0];
                    if (interval > maxInterval) maxInterval = interval;
                    if (interval < minInterval) minInterval = interval;
                }
            }
            if (Math.abs(minInterval / maxInterval) < 0.9) {
                return 'discrete';
            } else {
                return 'continuous';
            }
        }
    }

    return View;

});

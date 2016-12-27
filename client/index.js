import React from 'react';
import ReactDOM from 'react-dom';

var style = require('./style.scss');

import {observable, autorun} from "mobx";

import {observer} from "mobx-react";

import fetchJSONP from "fetch-jsonp"

import _ from "underscore";

import moment from "moment"

import { Router, Route, Link, IndexRoute, browserHistory } from 'react-router'

window.moment = moment;

var getTime = function(s) {
  return moment(s, 'DD/MM/YYYY').toDate().getTime();
}

var customTimeFormat = d3.time.format.multi([
  [".%L", function(d) { return d.getMilliseconds(); }],
  [":%S", function(d) { return d.getSeconds(); }],
  ["%I:%M", function(d) { return d.getMinutes(); }],
  ["%I %p", function(d) { return d.getHours(); }],
  ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
  ["%b %d", function(d) { return d.getDate() != 1; }],
  ["%B", function(d) { return d.getMonth() }],
  ["%Y", function() { return true; }]
]);

window.configobj = {
  beginning : getTime('01/01/2005'),
  ending: getTime('01/01/2019'),
  points: [
    {offset: 0, "beginning": getTime('01/05/2010'), "ending": getTime('02/06/2010'), img: 'http://lorempixel.com/400/200/', title: 'kaki', classes: 'important'},
    {offset:-3, "beginning": getTime('02/06/2011'), "ending": getTime('03/07/2011'), img: 'http://lorempixel.com/400/200/', title: 'popo', classes: 'silly'},
    {offset:-4, "beginning": getTime('02/06/2012'), "ending": getTime('02/06/2012'), img: 'http://lorempixel.com/400/200/', title: 'nunu'}
  ],
  windowwidth: 100
};

export default class Axis extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sf: 10 / (this.props.scale(0) - this.props.scale(10))
    };
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  componentDidMount() {
    var that = this;

    this.renderAxis();
  }

  animate() {
    var newscale = this.props.newscale;
    
    var that = this;
    
    var axis = d3.svg.axis()
		 .orient('bottom')
		 .scale(newscale);

    
    var axis2 = d3.svg.axis()
		  .orient('bottom')
		  .scale(newscale)
      		  .tickSize(that.props.height, 0, 0)
		  .tickFormat("");
    
    d3.select(this.refs.axis).transition()
		  .each("end", function(){
		    that.props.onZoom(newscale);
		  })
		  .duration(750).call(axis);
    

    d3.select(this.refs.timeaxis).transition().duration(750).call(axis2);


    d3.selectAll('#' + this.props.id + ' .point.rect').transition().duration(750).attr('x', function(r){
      return newscale(that.props.scale.invert(this.x.baseVal.value))
    })

      d3.selectAll('#' + this.props.id + ' .point.circ').transition().duration(750).attr('cx', function(r){
	return newscale(that.props.scale.invert(this.cx.baseVal.value))
      })

      
    d3.selectAll('#' + this.props.id + ' .box').transition().duration(750).attr('x', function(r){
      return newscale(that.props.scale.invert((this.x || this.cx ).baseVal.value))
    });
  }

  

  renderAxis() {
    var that = this;

    var axis = d3.svg.axis()
		 .orient('bottom')
		 .scale(this.props.scale)

    var axis2 = d3.svg.axis()
		  .orient('bottom')
            	  .tickFormat("")
		  .scale(this.props.scale)
      		  .tickSize(that.props.height, 0, 0);

    
    var xzoom = d3.behavior.zoom()
		  .x(this.props.scale)
		  .on("zoom", function(){
		    var scaleToZoom = that.props.scale;		    
		    that.props.onZoom && that.props.onZoom(scaleToZoom);
		  })

      var whenclick = function(){
	if (d3.event.defaultPrevented) return; // dragged

	var svg = d3.select('svg');
	var x = d3.mouse($('.bg')[0])[0];
	var dx = x - that.props.width / 2 ;
	var beginning = that.props.scale.invert(dx);
	var ending = that.props.scale.invert(that.props.width + dx);
	
	console.log('click', x, dx, beginning, ending);

	var newscale = d3.time
			 .scale()
			 .domain([beginning, ending])
			 .range([0, that.props.width]);

	
	that.props.animateTo(newscale);

	
      };

    d3.selectAll('#' + this.props.id + ' .point').on('click', whenclick);
    var sf = 10 / (that.props.scale(0) - that.props.scale(10));
    var k = that.state.sf / sf;
      
    var bg = d3.select(this.refs.bg)
	       .on('click', whenclick)
	       .on('wheel', null)
	       .on("wheel", function() {

		 if (k > 5 && d3.event.deltaY < 0) {
		   d3.event.stopPropagation();
		 }

		 if (k < 0.1 && d3.event.deltaY > 0) {
		   d3.event.stopPropagation();
		 }
	       });


    d3.select('#' + this.props.id).call(xzoom)
      
    d3.select(this.refs.axis).call(axis);

    d3.select(this.refs.timeaxis).call(axis2);

    
    if (this.props.newscale) {
	that.animate();
    }
    
  }

  render() {
    var that = this;
    var rects = this.props.config.points;
    var rectheight = that.props.big ? 10 : 4;
    rects = rects.map(function(p,i){
      var objprops = {
	x: that.props.scale(p.beginning),
	cx: that.props.scale(p.beginning),
	y:  -(that.props.height / 2) + (p.offset * rectheight*2 || 0),
	cy:  -(that.props.height / 2) + (p.offset * rectheight*2 || 0),
	
      };

      var rw = that.props.scale(p.ending) - that.props.scale(p.beginning);
      
      var rectprops = {
	...objprops,
	width: rw,
	height:rectheight,
	key:'rect_' + i,
      };

      var circprops = {
	...objprops,
	r: 5,
	key: 'circ_' + i,
      };

      var imgprops = {
	...objprops,
	width:100,
	key: 'img_' + i
      };

      var obj = (rw > 20 ?
		 <rect className={"point rect " + p.classes} onClick={()=>(console.log(p))} {...rectprops}></rect>
						    : (that.props.big ? null : <circle className={"point circ " + p.classes} onClick={()=>(console.log(p))} {...circprops} />))
      
      return (
	<g className="boxwrap" key={"gg_" + i} {...objprops} >
	{p.img && that.props.big ?
	 (<foreignObject className="box" {...objprops} key={"fobj_" + i} width="200" height="300" y={objprops.y + rectheight} x={objprops.x}>
	   <div className="infobox" >
	   <h4>{p.title || 'HEADLINE'}</h4>
	   <div className="text">{p.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas at lobortis arcu, id mollis magna. Nunc vel lectus nulla.'}</div>
	   <img {...imgprops} src={p.img} />
	   <a className="link" href={p.link || 'http://cat.com'} target="_blank">read more</a>
	   </div>
	   
	    </foreignObject>)
	    : null}
	{obj}
	</g>
      )
    });
    
    return (
      <g id={this.props.id} transform={'translate(0, ' + (this.props.mtop) + ')'}>
      {!this.props.big ? <rect className="window" stroke="black" y={-that.props.padding} x={$(window).width()/2 - that.props.config.windowwidth/2} fill="transparent" width={that.props.config.windowwidth} height={this.props.height} ></rect> : null}
      <rect className="bg" ref="bg" width="100%" height={this.props.height} transform={'translate(0, ' + -this.props.padding + ')'} x="0" y="0"></rect>
      <g className="axis timeaxis" ref="timeaxis"  strokeDasharray="10 10" transform={'translate(0, ' + -this.props.padding + ')'}></g>
      <g className="axis" ref="axis" transform={'translate(0, ' + (this.props.height - this.props.padding) + ')'}></g>
      <g className="points" ref="points" transform={'translate(0, ' + ((this.props.height - this.props.padding)) + ')'}>
      {rects}
      </g>
      </g>
    )
  }
}


var Timeline = React.createClass({
  getInitialState: function() {
    return {};
  },
  render() {
    var that = this;
    var props = this.props;

    var s1height = 100;
    var s1padding = 20;
    
    var settings2 = {
      id:'axis2',
      width: $(window).width(),
      mtop: 0,
      height: $(window).height() - s1height - s1padding,
      padding: 20,
      tickTime: d3.time.months,
      tickValues: null
    };
    
    var settings1 = {
      id: 'axis1',
      width: $(window).width(),
      mtop:settings2.height + settings2.padding,
      height: s1height,
      padding: s1padding,
      tickTime: d3.time.years,
      tickValues: null
    };


    var domain = [this.props.config.beginning, this.props.config.ending];
    var data = this.props.config;

    var fromScale2ToScale1Domain = function(s2) {
      var domain2 = s2.domain();
      var hscale = d3.time.scale()
		     .domain([domain2[0], domain2[1]])
		     .range([$(window).width()/2-data.windowwidth/2, $(window).width()/2 + data.windowwidth/2]);
      return [hscale.invert(0),hscale.invert($(window).width())];
    }
    
    if (this.state.scale2) {
      domain = fromScale2ToScale1Domain(this.state.scale2);
    }

      settings1.scale = this.state.scale1 || d3.time.scale()
					       .domain(domain)
					       .range([0, settings1.width]);
      
      settings2.scale = this.state.scale2 || d3.time.scale()
					       .domain([settings1.scale.invert($(window).width() / 2 - data.windowwidth/2), settings1.scale.invert($(window).width() / 2 + data.windowwidth/2)])
					       .range([0, settings2.width]);

    if (this.state.scale1Animate) {
      settings1.newscale = this.state.scale1Animate;
      settings2.newscale = d3.time.scale()
			     .domain([settings1.newscale.invert($(window).width() / 2 - data.windowwidth/2), settings1.newscale.invert($(window).width() / 2 + data.windowwidth/2)])
			     .range([0, settings2.width]);
    }

    if (this.state.scale2Animate) {
      var domain =  fromScale2ToScale1Domain(this.state.scale2Animate);
      settings1.newscale = d3.time.scale()
			     .domain(domain)
			     .range([0, settings1.width]);  
      settings2.newscale = this.state.scale2Animate;
    }

    return (
      
      <svg width={$(window).width()} height={$(window).height()} >
      
      <Axis big={true} {...settings2} {...this.props}
      onZoom={(scale2)=>{
	this.setState({scale2,scale1:null, scale2Animate:null, scale1Animate:null});
      }}
      animateTo={(scale2)=>{
	this.setState({scale2Animate: scale2, scale1Animate:null});}}

      />

      <Axis {...settings1} {...this.props}
      
      onZoom={(scale1)=>{	
	this.setState({scale1,scale2:null, scale2Animate:null, scale1Animate:null});
      }}
      
      animateTo={(scale1)=>{
	this.setState({scale1Animate: scale1,scale2Animate:null});}}
      />

      
      </svg>
    );
  }
});



export class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    if (!this.props.location.hash) {
      location.hash = encodeURIComponent(JSON.stringify(configobj));
    }
  }

  componentDidMount() {
    var that = this;
    $(window).resize(function(){
      that.forceUpdate();
    })
  }

  render() {
    if (!this.props.location.hash) {
      return null;
    }
    var config = JSON.parse(decodeURIComponent(this.props.location.hash.split('#')[1]));
    return (
      <div className="timewrap">
      <Timeline config={config} />
      </div>
    );
  }
}


$(function(){
  ReactDOM.render((
    <Router history={browserHistory}>
    <Route path="/" component={ App } />
    <Route path="/timeline/public" component={ App } />
    </Router>
  ), document.getElementById("myApp"));

})


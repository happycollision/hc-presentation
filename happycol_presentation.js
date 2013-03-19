jQuery.noConflict();
/*
 * Expects an object with the definittion of "theatre"
 *
 * Starts the whole ball a rollin'
 */
function happycol_presentation_init(options_object){
	//starts the whole ball rolling
	var final_options = happycol_presentation_options(options_object);
	
	if(final_options == false){
		console.log('The options to start the show returned false');
		return false;
	}
	//Time to rock.
	happycol_presentation_play(final_options);
}

/*
 * Params: options_object: an object with possible options defined. 
 * 
 * Expects that at least for the "theatre" will be
 * defined, else the presentation won't know where to run.
 *
 * Returns a new object with every possible option defined as its default, if not given
 */
function happycol_presentation_options(options_object){
	//if "theatre" is not defined or is not found in the DOM, return false
	if(options_object.theatre==null || options_object.theatre == ''){
		console.log('The theatre was not defined in the options object.');
		return false;
	}
	if( ! jQuery('.' + options_object.theatre).length ){
		console.log('The theatre was not found in the DOM.');
		return false;
	}
	
	//create list of default options
	var default_options = {
			stageManager:		true,		/*slides change automatically*/
			stageTime:			3,			/*duration of slides with in secondsSM*/
			program:			'create',	/*true=find the program, false=don't find, create=make one in either the designated area, or just under the presentation*/
			sceneChange:		'slide',	/*type of transition*/
			easing:				'easeInOutSine',
			sceneChangeSpeed:	200,		/*scene change speed*/
			intermission:		false, 		/*pause on mouse hover*/
			director:			false,		/*interaction buttons on stage*/
			techDirector:		'click',	/*program thumbnails allow scene changes, either false, 
											or type of action (click, hover, longHover)*/
			lightingDesigner:	false,		/*at start, overlay all other page elements with a color*/
			aisleSeat:			false,		/*clicking overlay always removes it, but 
											true= slideshow won't stop and false= slideshow will stop*/
			gel:				'000',		/*color code for overlay*/
			intensity:			0.75,		/*the opacity of the gel*/
			inCount:			1000,		/*speed of the light change into gel*/
			outCount:			1000,		/*the speed of the light change out of gel*/
			theatre:			null,		/*unique class name for the presentation must be given*/
			
			//tracking properties not changed by the user
			
			houseIsOut:			false,		/*tracks if the house is out or not*/
			disableRequests:	0			/*tracks request count*/
	}
	//replace any defined options
	for ( var key in options_object ) {
		default_options[key] = options_object[key];
	}
	default_options['theClass'] = '.' + default_options.theatre;
	return default_options;
}

/*
 * Params: args: object with all options defined
 *
 * Returns nothing.  Plays the presentation.
 *
 */
function happycol_presentation_play(args){
	happycol_assignments(args, function(){
		happycol_presentation_beginShow(args);
	});
	
}

/*
 * Params: args: an object with all options defined
 *
 * Expects a DOM elemet with class either "scene" or "curtain".  More "scene" elements are possible (and likely).
 *
 * Modifies the object passed in to add the following properties:
 *   num_scenes - the number of proper scenes in the presentation
 *   $curtain - jQuery Object with the curtain element selected
 *   $scenes - jQuery Object containing all proper scenes
 *   scene_ids - array of scene IDs
 *
 * Adds "previous", "current", "next", "first", and "last" classes
 * to the appropriate "scenes" in the DOM
 */
function happycol_assignments(args, callback){
	//.not and $nested is an attempt to keep nested presentations working properly...
	args.$nested = jQuery(args.theClass + ' .happycol_presentation').find('*');
	console.log(args.$nested);
	
	args.$curtain = jQuery(args.theClass + ' .curtain').not(args.$nested);
	args.$scenes = jQuery(args.theClass + ' .scene').not(args.$nested);
	args.$stage = jQuery(args.theClass + ' .stage').not(args.$nested);
	args.$theatre = jQuery(args.theClass);
	args.num_scenes = args.$scenes.length;
	console.log(args.num_scenes);

	//Check to see if we even have anybody waiting in the wings...
	if( (args.$curtain.length == 1 && args.num_scenes < 1) || (args.$curtain.length < 1 && args.num_scenes < 2 ) ){
		console.log('There are no scenes to shift');
		return false;
	}
	//completely hide curtain when not in use, but allow for it to be seen when JS is not enabled
	args.$theatre.before('<style>.curtain{display:none} .curtain.current{display:block}</style>')
	
	happycol_scene_assignments(args, function(){
		if(callback != undefined){
			callback();
		}
	});

}

/*
 *
 *
 */
function happycol_scene_assignments(args, callback){
	//Assign each scene with a UID via the theatre name as id and get an array of the names
	if(args.scene_ids == undefined){
		var idArray = new Array();
		var UID;
		args.$scenes.each(function(index){
			UID = args.theatre + '-' + (index + 1);
			jQuery(this).attr('id',UID);
			idArray[index] = UID;
		});
		args.scene_ids = idArray;
		args.scene_ids_original = idArray.slice(0);
	}else{
		//reset all the classes so we can play again from the beginning
		args.scene_ids = args.scene_ids_original.slice(0);
		args.$scenes.each(function(){
			jQuery(this).removeClass('current').removeClass('next').removeClass('previous');
		});
	}

	//Assign meaningful position classes
	//assign current
	if(args.$curtain.length){
		args.$curtain.addClass('current');
		//also set scene_ids backwards by one to be ready for advance
		args.scene_ids.unshift(args.scene_ids.pop());
	}else{
		args.$scenes.eq(0).addClass('current');
	}
	
	//assign next
	if(args.$curtain.length){
		args.$scenes.eq(0).addClass('next');
	}else{
		args.$scenes.eq(1).addClass('next');
	}
	
	//assign previous and last
	args.$scenes.eq(-1).addClass('previous').addClass('last');
	
	//assign first
	args.$scenes.eq(0).addClass('first');
	
	happycol_program_assignments(args, function(){
		if(callback != undefined){
			callback();
		}
	});
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Expects a DOM elemet with class "program" and "{uniqueID}"
 *
 * Modifies the object passed in to add the following properties:
 *   program_ids - array of program IDs
 *
 */
function happycol_program_assignments(args, callback){
	if(args.program == false){
		if(callback != undefined){
			callback();
		}
		return false;
	}
	if(args.program == 'create'){
		happycol_create_program(args, callback);
		return;
	}
	if(args.program === true){
		if(args.program_ids == undefined){
			programIDs = Array();
			if(args.$program == undefined){
				args.$program = jQuery('.program.' + args.theatre);
			}
			if(args.$program.length==0){
				console.log('The program element was not found. Tech Director disabled. Program showing disabled.');
				args.techDirector = false;
				args.program = false;
				if(callback != undefined){
					callback();
				}
				return false;
			}
			args.$listings = jQuery('.listing', args.$program);
			args.$listings.each(function(index){
				UID = args.theatre + '_p-' +(index +1);
				jQuery(this).attr('id',UID);
				programIDs[index] = UID;
				jQuery.data(jQuery(this)[0],'scene_id', args.theatre + '-' + (index+1));
			});
			
			args.program_ids = programIDs;
			args.program_ids_original = programIDs.slice(0);
		}else{
			args.program_ids = args.program_ids_original.slice(0);
			jQuery('.current', args.$program).removeClass('current');
		}
		
		//assign the current id, if there is one
		if(args.$curtain.length > 0){
			//don't assign, and set program_ids backwards by one to be ready for advance
			args.program_ids.unshift(args.program_ids.pop());
		}else{
			jQuery('#' + args.program_ids[0]).addClass('current');
		}
		
	}

	if(callback != undefined){
		callback();
	}

}

/*
 *Params: args: same ol' same ol'
 *
 */
function happycol_create_program(args, assignment_callback){
	//create holder then double check it's created
	for(var i=0;i<=2;i++){
		args.$program = jQuery('.program.' + args.theatre);
		if(args.$program.length==0){
			//gotta create the holder for the program
			args.$theatre.after(
				'<ul class="program ' +  args.theatre + '">' +
				'<li class="previous">Previous</li>'
			);
		}else{
			break;
		}
		if(i==1){
			//okay... things are busted.
			console.log('error creating program');
			args.program = false;
			happycol_program_assignment(args, assignment_callback);
			return false;
		}
	}
	
	//create the listings as <li>s
	for(i in args.scene_ids){
		args.$program.append(
			'<li class="listing">hello</li>'
		);
	}
	if(args.techDirector == true){
		args.$program.append(
			'<li class="play">Play</li>' +
			'<li class="stop">Stop</li>' +
			'<li class="next">Next</li>'
		);
	}
	args.$program.append(
		'</ul>'
	);
	//Do stuff, then
	args.program = true;
	happycol_program_assignments(args, assignment_callback);
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Checks for a preshow, then either sends to preshow or to show
 *
 */
function happycol_presentation_beginShow(args){
	//check for preshow
	happycol_enable_controls(args);
	if( 
		
		//list of conditions for a preshow
		args.lightingDesigner == true  
		
		){
		happycol_presentation_preshow(args);
	}else{
		happycol_presentation_theShow(args);
	}
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Runs the preshow, then does the show.
 *
 */
function happycol_presentation_preshow(args){
	happycol_request_disable_controls(args);
	happycol_houseOut(args, function(){
		happycol_request_enable_controls(args);
		happycol_presentation_theShow(args);
	});
}

/*
 * Params: 	args: the ever-changing presentation object
 *			callback: any callback function (basically used to either
 *				start the show, or to do nothing)
 *
 * Brings down the lights (if necessary), then starts the show
 *
 */
function happycol_houseOut(args, callback){
	if(args.houseIsOut==false){
		
		//The first call to houseOut is different than subsequent calls.
		if(args.$gel==undefined){
			happycol_buildGel(args);
		
			//make stuff happen with jQuery
			args.$gel.animate({opacity:args.intensity},args.inCount, function(){
				//let the program know that the lights are now down
				args.houseIsOut = true;
				args.$gel.click(function(){
					//send to houseUp function to determine all necessary actions
					happycol_requestHouseUp(args);
				});
				
				if(callback != undefined){
					callback();
				}
			});

		// Subsequent calls can just fade.
		}else{
			args.$gel.fadeIn(args.inCount,function(){
				args.houseIsOut = true;
			});
			if(callback != undefined){
				callback();
			}
		}
		
	}else{
		if(callback != undefined){
			callback();
		}
	}
	return;
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Builds a gel, if one doesn't exist
 */
function happycol_buildGel(args){
	//check options and assign variables
	if(jQuery(args.theClass + '_gel').length==0){
		jQuery('body').append(
			'<div class="' + args.theatre + '_gel"></div>'
		);
	}
	args.$gel = jQuery(args.theClass + '_gel');
	args.$gel.css({
		'background-color':'#' + args.gel,
		'opacity':'0',
		'position':'absolute',
		'top':'0',
		'left':'0',
		'right':'0',
		'bottom':'0',
		'z-index':'100',
		//'display':'none'
	});
	jQuery(args.theClass + ' .stage').not(args.$nested).css({'z-index':'101','position':'relative'});
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Checks options, then either brings the house lights back up, or stops the show entirely
 */
function happycol_requestHouseUp(args){
	if(args.aisleSeat==false){
		happycol_postShow(args);
	}else{
		happycol_houseUp(args);
	}
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Brings the house lights back up
 */
function happycol_houseUp(args, callback){
	if(args.houseIsOut == true){
		args.$gel.fadeOut(args.outCount,function(){
			args.houseIsOut = false;

			if(callback != undefined){
				callback();
			}
		});
	}
}

/*
 * Params: args: the ever-changing presentation object
 *
 * Starts the show
 */
function happycol_presentation_theShow(args){
	if(args.stageManager==true){
		happycol_stageManager(args);
	}
}



/*
 * Params: none
 *
 * Make a request to disallow the user from pushing buttons.
 * Keeps track of how many requests have been made in the args object.
 */
function happycol_request_disable_controls(args){
	if(args.disableRequests > 0){
		args.disableRequests++;
		console.log('request disable: ' + args.disableRequests);
		return;
	}
	args.disableRequests++;
	console.log('request disable: ' + args.disableRequests);
	if(args.disableRequests > 0){
		happycol_disable_controls(args);
	}
}

/*
 * Params: none
 *
 * Make a request to re-allow the user to push buttons.
 * Keeps track of how many requests have been made in the args object.
 */
function happycol_request_enable_controls(args){
	args.disableRequests--;
	console.log('request enable: ' + args.disableRequests);
	if(args.disableRequests <= 0){
		happycol_enable_controls(args);
	}
}

/*
 *
 *
 */
function happycol_disable_controls(args){
		if(args.techDirector == true){
		args.$programPlay.unbind('click');
		args.$programStop.unbind('click');
		args.$programNext.unbind('click');
		args.$programPrevious.unbind('click');
		args.$listings.each(function(index){
			jQuery(this).unbind('click');
		});
	}
	if(args.director == true){
		args.$stagePlay.unbind('click');
		args.$stageStop.unbind('click');
		args.$stageNext.unbind('click');
		args.$stagePrevious.unbind('click');
	}
	console.log('controls disabled');
}

/*
 *
 *
 */
function happycol_enable_controls(args){
	//Assign buttons to variables if they aren't already
	if(args.buttonsAssigned == undefined || args.buttonsAssigned == false){
		if(args.techDirector == true){
			args.$programPlay = jQuery('.play',args.$program);
			args.$programStop = jQuery('.stop',args.$program);
			args.$programNext = jQuery('.next',args.$program);
			args.$programPrevious = jQuery('.previous',args.$program);
		}
		if(args.director == true){
			args.$stagePlay = jQuery('.play',args.$theatre.not(args.$nested));
			args.$stageStop = jQuery('.stop',args.$theatre.not(args.$nested));
			args.$stageNext = jQuery('.next',args.$theatre.not(args.$nested));
			args.$stagePrevous = jQuery('.previous',args.$theatre.not(args.$nested));
		}
		
		args.buttonsAssigned = true;
	}
	//Hook 'em up.
	if(args.techDirector == true){
		args.$programPlay.unbind('click').click(function(){
			happycol_program_playPause_toggle(args, jQuery(this))
		});
		args.$programStop.unbind('click').click(function(){
			happycol_postShow(args);
		});
		args.$programNext.unbind('click').click(function(){
			if(happycol_isTimed(args) == true){
				happycol_stopStopwatch(args);
				happycol_sceneChange(args); //defaults to next scene
				happycol_startStopwatch(args);
			}else{
				happycol_sceneChange(args);
			}
		});
		args.$programPrevious.unbind('click').click(function(){
			if(happycol_isTimed(args) == true){
				happycol_stopStopwatch(args);
				$previous_scene = happycol_getPrevious(args);
				happycol_sceneChange(args,$previous_scene);
				happycol_startStopwatch(args);
			}else{
				$previous_scene = happycol_getPrevious(args);
				happycol_sceneChange(args,$previous_scene);
			}
		});
		args.$listings.each(function(index){
			jQuery(this).unbind('click').click(function(){
				var new_scene = jQuery.data(jQuery(this)[0],'scene_id');
				var $new_scene = jQuery('#' + new_scene);
				if(happycol_isTimed(args) == true){
					happycol_stopStopwatch(args);
					happycol_sceneChange(args,$new_scene);
					happycol_startStopwatch(args);
				}else{
					happycol_sceneChange(args,$new_scene);
				}
			});
		});
	}
	if(args.director == true){
		args.$stagePlay.unbind('click').click(function(){
			happycol_program_playPause_toggle(args, jQuery(this))
		});
		args.$stageStop.unbind('click').click(function(){
			happycol_postShow(args);
		});
		args.$stageNext.unbind('click').click(function(){
			if(happycol_isTimed(args) == true){
				happycol_stopStopwatch(args);
				happycol_sceneChange(args); //defaults to next scene
				happycol_startStopwatch(args);
			}else{
				happycol_sceneChange(args);
			}
		});
		args.$stagePrevious.unbind('click').click(function(){
			if(happycol_isTimed(args) == true){
				happycol_stopStopwatch(args);
				$previous_scene = happycol_getPrevious(args);
				happycol_sceneChange(args,$previous_scene);
				happycol_startStopwatch(args);
			}else{
				$previous_scene = happycol_getPrevious(args);
				happycol_sceneChange(args,$previous_scene);
			}
		});
	}
	console.log('controls enabled');

}

function happycol_isTimed(args){
	if(args.intervalID == undefined){
		return false;
	}
	return true;
}

function happycol_getPrevious(args){
	return jQuery('#' + args.scene_ids[args.scene_ids.length - 1]);
}

function happycol_program_playPause_toggle(args,$this){
	if($this.attr('class') == 'play'){
		happycol_presentation_beginShow(args);
		$this.empty().append('Pause').removeClass().addClass('pause');
		return;
	}
	if($this.attr('class') == 'pause'){
		happycol_presentation_pause(args);
		$this.empty().append('Play').removeClass().addClass('play');
		return;
	}
}

function happycol_set_interactors(args,into_state){
	if(args.$programPlay == undefined){return;}
	if(into_state == 'play'){
		args.$programPlay.empty().append('Play').removeClass().addClass('play');
	}
	if(into_state == 'pause'){
		args.$programPlay.empty().append('Pause').removeClass().addClass('pause');
	}
}

function happycol_presentation_pause(args){
	happycol_stageManager(args,true);
}

/*
 *
 *
 */
function happycol_postShow(args){
	happycol_houseUp(args);
	if(args.stageManager == true){
		//true tells the stageManager to pause (end the show)
		happycol_stageManager(args, true);
	}
	if(args.$curtain.length > 0){
		//send curtain to new scene change
		happycol_sceneChange(args, args.$curtain);
	}
	console.log('trying to assign');
	happycol_scene_assignments(args);
}

/*
 *
 *
 */
function happycol_stageManager(args, pause){
	//console.log('stageManager func called: ' + args.theatre);
	if(pause != undefined && pause == true){
		args.$stage.unbind('hover');
		happycol_stopStopwatch(args);
		happycol_set_interactors(args, 'play');
		return;
	}
	happycol_startStopwatch(args);
	happycol_set_interactors(args, 'pause');
	
	//clear interval on hovers
	if(args.intermission == true){
		args.$stage.hover(function(){
			if(args.intervalID == undefined) {return;}
			happycol_stopStopwatch(args);
		},function(){
			happycol_startStopwatch(args);
		});
	}
}

/*
 *
 *
 */
function happycol_sceneChange(args, $next_scene){
	happycol_request_disable_controls(args);
	
	happycol_determine_new_scene(args,$next_scene,function(){
		happycol_request_enable_controls(args);
	});
	
}

/*
 *
 *
 */
function happycol_determine_new_scene(args, $next_scene, callback){
	//Auto incremented?
	if($next_scene==undefined){
		//yes, auto increment
		$next_scene = jQuery('#' + args.scene_ids[1]);
	}
	// Let's make sure we have to go anywhere
	if($next_scene.get(0) == jQuery('.current',args.$theatre).not(args.$nested).get(0)){
		if(callback != undefined){
			callback();
		}
		return;
	}
	
	
	//Going past last slide?
	if(jQuery('.current.last', args.$theatre).not(args.$nested).length > 0 && $next_scene.get(0)===jQuery('.first', args.$scenes).get(0)){
		//call post show
		happycol_postShow(args);
		
		//make sure we give a touch of time for the postshow to call another
		//disable controls before we call a re-enable in the calling method
		setTimeout(function(){callback();},100);
		return;
	}
	
	
	//If we made it this far, the slideshow is still playing
	//Shift the array until it lands on the new scene
	for(index in args.scene_ids){
		
		if(args.scene_ids[0] == $next_scene.attr('id')){
			break;
		}
		args.scene_ids.push(args.scene_ids.shift());
		if(args.program == true){
			args.program_ids.push(args.program_ids.shift());
		}
	}
	//animate the change to current scene_ids array
	happycol_animate_scene_out(args);
	happycol_animate_scene_in(args, $next_scene, callback);
	
	
	//assign new positions other than the .current, which was already assigned
	//Since the "previous" and "next" classes are symantically incorrect (they actually refer to
	//scenes "next to" the current scene, it is best to assign them this way, rather than above.
	var $old_next = jQuery('.next', args.$theatre).not(args.$nested);
	var $old_previous = jQuery('.previous', args.$theatre).not(args.$nested);
	var $new_previous = jQuery('#' + args.scene_ids[args.scene_ids.length-1]);
	var $new_next = jQuery('#' + args.scene_ids[1]);
	
	$old_next.removeClass('next');
	$old_previous.removeClass('previous');
	$new_previous.addClass('previous');
	$new_next.addClass('next');
	
		
}

/*
 *
 *
 */
function happycol_animate_scene_out(args){
	//some kinda switch case... then:
	//needs animation...
	switch (args.sceneChange){
		case 'none':
			jQuery('.current', args.$theatre).not(args.$nested).removeClass('current');
			break;
		case 'slide up':
			//jQuery('.current', args.$theatre).not(args.$nested).hide('slide',{direction: //'up'},args.sceneChangeSpeed,function(){
			//	jQuery(this).removeClass('current');
			//});
			jQuery('.current', args.$theatre).not(args.$nested).animate(
				{
					top: '-=100%'
				},{
					duration:	args.sceneChangeSpeed,
					complete:	function(){
									jQuery(this).removeClass('current').css({top: '0', left: '0'});
								},
					easing:		args.easing,
				}
			);
			break;
		case 'slide':
		default:
			jQuery('.current', args.$theatre).not(args.$nested).hide('slide',args.sceneChangeSpeed,function(){
				jQuery(this).removeClass('current');
			});
			break;
	}
	
	//probably needs no animation
	if(args.program==true){
		jQuery('.current', args.$program).removeClass('current');
	}
}

/*
 *
 *
 */
function happycol_animate_scene_in(args, $next_scene, callback){
	happycol_request_disable_controls(args);
	switch (args.sceneChange){
		case 'none':
			$next_scene.addClass('current');
			happycol_request_enable_controls(args);
			break;
		case 'slide up':
			//$next_scene.show('slide',{direction: 'down'},args.sceneChangeSpeed,function(){
			//	jQuery(this).addClass('current');				
			//});
			$next_scene.css({top:'+=100%'}).addClass('current').animate(
				{
					top: '0',
				},{
					duration:	args.sceneChangeSpeed,
					complete:	function(){
									happycol_request_enable_controls(args);
								},
					easing:		args.easing,
				}
			);
			break;
		case 'slide':
		default:
			$next_scene.show('slide',{direction: 'right'},args.sceneChangeSpeed,function(){
				jQuery(this).addClass('current');
				happycol_request_enable_controls(args);
			});
			break;
	}
	//program too
	if(args.techDirector == true){
		jQuery('#' + args.program_ids[0]).addClass('current');
	}
	
	
	if(callback != undefined){
		callback();
	}
}


/*
 *
 *
 */
function happycol_startStopwatch(args){
	if(args.stageManager != true){ return; }
	
	var seconds = (args.stageTime * 1000) + args.sceneChangeSpeed + 100; //Keeps from overlapping
	args.intervalID = setInterval(function(){happycol_sceneChange(args)},seconds);
}
/*
 *
 *
 */
function happycol_stopStopwatch(args){
	if(args.stageManager != true){ return; }
	
	if(args.intervalID != undefined){
		args.intervalID = clearInterval(args.intervalID);
		return;
	}
}
## Aim: to create a typescript / React based project for searching and animating kanji ##

- The library is expected to be imported into webapps and potentially into react native projects. 
- The library should be yarn/npm installable
- Where possible the library should be self contained and not require additional imports like files into /public folder
- Where possible, the library should load as little data into working memory so we don't eat up the javascript thread memory in production
- Where possible, we should leverage the existing python code in this current repo for working out how to extract kanji, radicals, strokes etc

## Phase 1: investigation ##
- Read through this repository and map out the files and data structure. In particular map out the data structure of the kanji/ svg files. 
- In these files, understand the structure of the SVG files and how components, radicals, strokes and kanji are defined. 
- Map out what sort of functions this repository is able to do with the kanji data
- Map out how stroke order is defined in the files and how we should keep stroke order so we always draw kanji correctly.

As an output, produce a document that I can review that outlines the above points for phase 1

## Phase 2: Planning ##
We need to create a typescript library that can be loaded into webapps. The library should have these functions and methods available to end-users

constructor: KanjiVG()

KanjiVG provides the following public methods

getKanji(kanji: string)
* kanji: string is the kanji character to return information about. e.g 車, or a unicode like 04e0b which maps to the svgs
* returns an object which contains information from the SVGs that we need in order to draw and animate the kanji. Returns a list of length one for most kanji, or for some, will also return additional variants where available. It should be clear which are variants.

searchRadical(radical: string)
* returns a list of objects of possible kanji containing the searched radical

getRandom()
* returns a random kanji object

React component KanjiSVG. To be used as a react component like

```
<KanjiCard
    kanji={kanji}
    showInfo={false}
    animationOptions={{
      strokeDuration: 800, // ✅ Duration of each stroke in ms
      strokeDelay: 500, // ✅ Delay between strokes in ms
      showNumbers: true,
      loop: false, // ✅ Don't loop animation
      showTrace: true,
      strokeStyling: {
        strokeColour: 'black',
        strokeThickness: 6,
        strokeRadius: 10,
      },
      radicalStyling: {
        radicalColour:'#ff0000',
        radicalThickness: 2,
        radicalRadius: 0,
      },
      traceStyling: {
        traceColour: '#a9a5a5',
        traceThickness: 2,
        traceRadius: 0,
      },
      numberStyling: {
        fontColour: '#10d6a1',
        fontWeight: 900,
        fontSize: 12,
      }
    }}
  />
```
where kanji is the kanji to display. Show info optionally displays info about the kanji that we extract from the SVGs. Users can control the animation speed, whether to show numbers or not, loop options for the animation, stroke styling, trace styling, radical styling and number styling. It is important that this always draws strokes in the correct order as defined in this original repository

- Stroke corresponds to each line that is drawn that makes up a kanji. Users can provide a single colour or a list of colours that can be cycled through as the kanji is drawn. 
- Radical corresponds to a kanji radical that will consist of multiple strokes. If radical styling is provided, it overrides the stroke styling. Again users can provide a single colour or a list of colours that can be cycled through as the radical is drawn.
- Trace corresponds to a lighter outline of the final kanji that is show as the kanji is drawn out. Users can opt to show or hide this trace
- Number styling corresponds to the numbers that are drawn next to each line that makes up the kanji
- show info is an optional panel that appears that displays information about the kanji including the number of strokes, and if it has a radical, what the radical is

### Tests ###

For each user function that we make, we should have tests. At the very minimum we should include these tests:

1. can load kanji. A test for getKanji that when run for a given kanji, returns the expected kanji information
2. can get radical. a test for searchRadical that when given a particular kanji (say 姉) will return the expected radical e.g 女
3. getRandom(). A test that when run, returns a random kanji character
4. Tests for KanjiCard
* Styling tests that confirm if a strokeColour: [blue, green, red] is provided, then strokes are drawn with those colours and looped through as it is drawn
* Styling tests that confirm if a strokeColour: black is provided, then strokes are drawn with those just black colour
* Styling tests that confirm if a radicalColour: [blue, green, red] is provided, then radical strokes are drawn with those colours and looped through as the radical is drawn
* Styling tests that confirm if a radicalColour: red is provided, then strokes of the radical are drawn with those just red colour
* a test that if both stroke and radical styling is provided, then radical styling is preferenced over stroke styling for the radical component
* similar styling tests for trace and number styling
* Tests that ensure the correct stroke order is maintained when drawing the kanji

As part of this planning phase, it is important to plan what we need to do with the data. e.g one option is to keep the svg's as they are. an other is to convert them (through a script) into json or other types of files. Considerations: we do not want end users to load all the files up at once and hold this in memory. The solution should be memory efficient. I would expect that when a user requests a single kanji, that is when we load the file. Also take into consideration how we will bundle this package so users can download and yarn add or nmp install. Do they need to download additional files for the package to work? Ideally it is just a yarn install and thats it.

At the end of phase 2, I would like you to produce an output document that summarises what the plan is that you need to follow. It will highlight additional points that I have not considered in this plan that we should probably consider in our exectution. This plan should form the blueprint for what we are to build, so I expect it will take a bit of back and forth for us to get right. 

We may need to produce some small POCs to confirm that we can do things as we expect.


## Phase 3: implementation ##

Here we begin to implement. It is important that we only implement what is in the plan. As we begin to implement, we may discover additional things that were not apparent during the planning phase. These should be called out and we should decide which way to proceed. 

We will create a folder in this repository to house our new library. The folder will be called `kanjivg_js`. The project is expected to be called kanjivg-js, ie i expect people will load the library with import { ... } from 'kanjivg-js';

Our project should include a gitignore, cursorignore and npmignore file. 



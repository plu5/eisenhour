.. raw:: html

  <h1>
  <img src="https://raw.githubusercontent.com/plu5/eisenhour/main/client/public/favicon.ico" width="32"/>
  Eisenhour
  </h1>

*Eisenhour* is a free and open-source time-management application that syncs with Google Calendar (support for other calendar services is planned) and represents calendar events as timers. It allows creating task groups to categorise timers with regex matching against their titles, and tally the amount of time put into each task group.

.. figure:: https://raw.githubusercontent.com/plu5/eisenhour/main/docs/_static/img/col.png
   :align: center

|
:Source code:   https://github.com/plu5/eisenhour
:Issue tracker: https://github.com/plu5/eisenhour/issues

..
  TODO: Documentation, Features

.. contents::

-----
Usage
-----

#. Get a local copy of this repository: either clone it or download and extract `ZIP of latest <https://github.com/plu5/eisenhour/archive/main.zip>`_   
#. Install the server `dependencies`_ [``npm install``]
#. Install the client `dependencies`_ [``cd client && npm install``]
#. Run ``npm start``
#. Open http://localhost:3002/ in your browser

Dependencies
^^^^^^^^^^^^

The server dependencies are in ``./package.json``, and the cilent dependencies are in ``./client/package.json``.

**Required:**

- node.js
- ``concurrently``
- Server-specific:

  - ``express ^4.17.1``
  - ``body-parser ^1.19.0``
  - ``googleapis ^67.0.0``
  - ``nanoid ^3.1.20``

- Client-specific (most of these are from the react template config, I may be able to get rid of some in future):

  - ``react ^16.13.1``
  - ``react-datepicker ^3.4.1``
  - ``use-custom-compare-effect ^0.0.5``
  - ``json.date-extensions ^1.2.2``
  - ``webpack ^4.42.0``
  - ``react-dev-utils ^10.2.1``
  - ``react-dom ^16.13.1``
  - ``webpack-dev-server ^3.11.0``
  - ``webpack-manifest-plugin ^2.2.0``
  - ``workbox-webpack-plugin ^4.3.1``
  - ``@babel/core ^7.9.0``
  - ``babel-loader ^8.1.0``
  - ``babel-plugin-named-asset-import ^0.3.6``
  - ``babel-plugin-transform-react-jsx ^6.24.1``
  - ``babel-preset-react-app ^9.1.2``
  - ``case-sensitive-paths-webpack-plugin ^2.3.0``
  - ``css-loader ^3.4.2``
  - ``dotenv ^8.2.0``
  - ``dotenv-expand ^5.1.0``
  - ``echo-loader ^0.0.1``
  - ``file-loader ^4.3.0``
  - ``fs-extra ^8.1.0``
  - ``html-webpack-plugin ^4.0.0-beta.11``
  - ``mini-css-extract-plugin ^0.9.0``
  - ``optimize-css-assets-webpack-plugin ^5.0.3``
  - ``pnp-webpack-plugin ^1.6.4``
  - ``postcss-flexbugs-fixes ^4.1.0``
  - ``postcss-loader ^3.0.0``
  - ``postcss-normalize ^8.0.1``
  - ``postcss-preset-env ^6.7.0``
  - ``postcss-safe-parser ^4.0.1``
  - ``resolve ^1.15.0``
  - ``resolve-url-loader ^3.1.1``
  - ``style-loader ^0.23.1``
  - ``terser-webpack-plugin ^2.3.8``
  - ``ts-pnp ^1.1.6``
  - ``url-loader ^2.3.0``

**Optional:**

- ``jest`` -- to run tests

Getting started
^^^^^^^^^^^^^^^

.. figure:: https://raw.githubusercontent.com/plu5/eisenhour/main/docs/_static/img/mainview.png
   :align: center

If you want to be able to sync with Google Calendar, edit the file ``server/secrets.js``, then relaunch Eisenhour.

You can then sync down the events from your calendar with the :kbd:`↓ sync down` button.

You can start a new timer by typing a name for it in the Timebar (2) and pressing :kbd:`Enter`.

.. figure:: https://raw.githubusercontent.com/plu5/eisenhour/main/docs/_static/img/timer.png
   :align: center

A running timer is a timer that has no end time. Its elapsed time displays in green and ticks on every second. To stop a timer, press the :kbd:`⏹ stop` button.

A stopped timer can be restarted from current time with the :kbd:`▶ restart` button, or "resumed as new" with the :kbd:`+ resume as new` button, which will create a new timer with the same name and description starting at current time.

To edit a timer, hover over it and press the :kbd:`✏️ edit` button to the right of it.

You can categorise timers by creating task groups.

.. figure:: https://raw.githubusercontent.com/plu5/eisenhour/main/docs/_static/img/taskgroup-edit.png
   :align: center

Each task group should have a name and at least one regex matcher. It can be given a colour, which can be any CSS colour or hex, and will be used to colour the backgrounds of all matching timers.

In the Statistics (6) section, you can tally the amount and total duration of timers matching each task group for a given year.

----------
Influences & acknowledgements
----------

- `kin <https://github.com/KinToday>`_
- `Ben Awad <https://www.youtube.com/c/BenAwad97>`_

SHELL := /bin/bash

version = 0.0.1
plugin = book-schedule

# Building everything
all: release

release: $(plugin)-$(version).zip $(plugin)-$(version).tgz

clean: clean-minify clean-release

sync: svn
	rsync -r -R --delete $(Files) svn/trunk

svn:
	svn co http://plugins.svn.wordpress.org/$(plugin) svn

clean-release:
	rm -f $(plugin)-$(version).zip $(plugin)-$(version).tgz
	rm $(plugin)

coreFiles = readme.txt README.md LICENSE $(plugin).php lib/BookSchedule.php lib/utils.php
core: $(coreFiles)

# Submodules
#submoduleFiles = $(WPSettings) $(JqueryUiMultiselect) $(JqueryUiTimepicker)
#submodules: wp-settings jquery-ui-multiselect jquery-ui-timepicker
submoduleFiles = $(WPSettings)
submodules: wp-settings

WPSettings = $(shell ls lib/wp-settings/{LICENSE,README.md,WPSettings.php,js/wpsettings.min.js})
wp-settings: $(WPSettings)

#JqueryUiMultiselect = $(shell ls lib/jquery-ui-multiselect/{src/{jquery.multiselect.filter.min.js,jquery.multiselect.min.js},i18n/*,jquery.multiselect.css,jquery.multiselect.filter.css})
#jquery-ui-multiselect: $(JqueryUiMultiselect)

#JqueryUiTimepicker = $(shell ls lib/jquery-ui-timepicker/src/jquery-ui-timepicker-addon.{js,css})
#jquery-ui-timepicker: $(JqueryUiTimepicker)

#jqueryUi = $(shell ls css/jquery-ui/{images/*,jquery-ui.min.css,jquery-ui.structure.min.css,jquery-ui.theme.min.css})
#jquery-ui: $(jqueryUi)

js: minifyjs

# Minifying Files
minify: minifyjs

clean-minify: clean-minifyjs clean-minifycss

# Javscript Files
JSMinFiles=js/bookschedule.js
minifyjs: $(JSMinFiles:.js,.min.js)

$(JSMinFiles:.js,): %.min.js: %.js
	echo minify $< > $@

clean-minifyjs:
	rm -f $(JSMinFiles:.js,.min.js)

# CSS Files
#CssMinFiles=css/basicStyle.min.css css/ghierarchy.min.css
#minifycss: $(CssMinFiles)

#clean-minifycss:
#	rm -f $(CssMinFiles)

#css/ghierarchy.min.css: css/ghierarchy.css
#	minify css/ghierarchy.css > css/ghierarchy.min.css

#css/basicStyle.min.css: css/basicStyle.css
#	minify css/basicStyle.css > css/basicStyle.min.css

Files = $(JSFiles) $(coreFiles) $(albumFiles) $(submoduleFiles)
# Building the release file
$(plugin):
	ln -s . $(plugin)

$(plugin)-$(version).zip: $(plugin) core js submodules
	zip -X $(plugin)-$(version).zip $(addprefix $(plugin)/,$(Files))

$(plugin)-$(version).tgz: $(plugin) core js submodules
	tar -czf $(plugin)-$(version).tgz $(addprefix $(plugin)/,$(Files))

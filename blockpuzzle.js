var BlockPuzzle = {
    Line: function() {
        this.getElement = function() {
            return self.element;
        }

        this.setPoints = function(point1, point2) {
            self.element.setAttribute("x1", point1[0]);
            self.element.setAttribute("y1", point1[1]);
            self.element.setAttribute("x2", point2[0]);
            self.element.setAttribute("y2", point2[1]);
        };

        this.setWidth = function(width) {
            self.element.setAttribute("stroke-width", width);
        }

        this.setColor = function(color) {
            self.element.setAttribute("stroke", color);
        }

        this.setVisible = function(visible) {
            if (visible) {
                self.element.setAttribute("visibility", "visible");
            } else {
                self.element.setAttribute("visibility", "hidden");
            }
        }

        var self = this;
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "line");
    },

    Day: function(date, lastDayOfMonth) {
        this.getElement = function() {
            return self.getLine().getElement();
        };

        this.getLine = function() {
            if (self.line !== null) {
                return self.line;
            }

            self.line = new BlockPuzzle.Line();
            if (self.lastDayOfMonth) {
                self.line.setWidth(2);
                self.line.setColor("rgba(100, 100, 100, 0.5)");
            } else {
                self.line.setWidth(1);
                self.line.setColor("rgba(200, 200, 200, 0.4)");
            }
            return self.line;
        }

        var self = this;
        self.line = null;
        self.date = date;
        self.lastDayOfMonth = lastDayOfMonth;
        self.element = null;
    },

    Canvas: function(elementName) {
        this.getDateOffsetXCoordinate = function(offset) {
            return (offset + 1) * self.dayWidth;
        }

        this.handleSizeChange = function(object) {
            if (self.width == self.parentElement.clientWidth) {
                return;
            }

            self.height = self.trackHeight * self.numberOfTracks;
            self.width = self.parentElement.clientWidth;
            self.dayWidth = self.width / self.dates.length;

            self.element.style.width = self.width;
            self.element.style.height = self.height;
            self.element.setAttribute("viewBox", "0 0 " + self.width + " " + self.height);

            for (var i = 0; i < self.dates.length; i++) {
                var x = self.getDateOffsetXCoordinate(i);
                var date = self.dates[i];
                var line = self.dates[i].getLine();
                line.setVisible(date.lastDayOfMonth || self.dayWidth > 2);
                line.setPoints([x, 0], [x, self.height]);
            }

            for (var i = 0; i < self.tracks.length; i++) {
                var lineY = (i + 1) * self.trackHeight;
                self.tracks[i].setPoints([0, lineY], [self.width, lineY]);
            }
        }

        this.fillDatesArray = function() {
            self.dates = [];
            var currentDate = self.startDate;
            while (currentDate <= self.endDate) {
                var nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);

                self.dates.push(new BlockPuzzle.Day(currentDate, nextDate.getDate() == 1));

                currentDate = nextDate;
            }
        }

        this.setDates = function(startDate, endDate) {
            self.startDate = startDate;
            self.endDate = endDate;
            self.fillDatesArray();

            for (var i = 0; i < self.dates.length; i++) {
                self.element.appendChild(self.dates[i].getElement());
            }

            self.handleSizeChange();
        }

        var self = this;
        self.parentElement = document.getElementById(elementName);
        self.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        self.trackHeight = 40;
        self.numberOfTracks = 10;
        self.dayLines = [];
        self.weekLines = [];

        self.tracks = [];
        for (var i = 1; i < self.numberOfTracks; i++) {
            var track = new BlockPuzzle.Line();
            track.setWidth(2);
            track.setColor("rgb(256, 100, 100)");
            self.tracks.push(track);
            self.element.appendChild(track.getElement());
        }

        self.setDates(new Date(2014, 1, 1, 0, 0, 0, 0),
                      new Date(2014, 12, 31, 0, 0, 0, 0));

        self.handleSizeChange();

        self.parentElement.appendChild(this.element);

        window.onresize = function() {
            self.handleSizeChange();
        }
    },
}

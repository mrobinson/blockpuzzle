var BlockPuzzle = {
    TRACK_HEIGHT: 40,
    RESERVATION_PADDING: 1,
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
        this.buildDOM = function(container) {
            if (self.line === null) {
                self.line = new BlockPuzzle.Line();
                if (self.lastDayOfMonth) {
                    self.line.setWidth(2);
                    self.line.setColor("rgba(100, 100, 100, 0.5)");
                } else {
                    self.line.setWidth(1);
                    self.line.setColor("rgba(200, 200, 200, 0.4)");
                }
            }

            container.appendChild(self.line.getElement());
        }

        this.positionAndSizeElements = function(canvas, dayIndex) {
            var x = canvas.getDateOffsetXCoordinate(dayIndex);
            self.line.setVisible(self.lastDayOfMonth || canvas.dayWidth > 2);
            self.line.setPoints([x, 0], [x, canvas.height]);

        }

        var self = this;
        self.line = null;
        self.date = date;
        self.lastDayOfMonth = lastDayOfMonth;
    },

    Reservation: function(name, start, end) {
        var self = this;
        self.name = name;

        // Normalize dates to all be at midnight.
        self.start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        self.end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
        self.element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    },

    Track: function(name) {
        this.buildDOM = function(container) {
            if (self.line === null) {
                self.line = new BlockPuzzle.Line();
                self.line.setWidth(2);
                self.line.setColor("rgb(256, 100, 100)");
            }
            container.appendChild(self.line.getElement());
        }

        this.addReservation = function(reservation) {
            this.reservations.push(reservation);
        }

        this.positionAndSizeElements = function(canvas, trackIndex) {
            var lineY = (trackIndex + 1) * BlockPuzzle.TRACK_HEIGHT;
            self.line.setVisible(trackIndex != canvas.tracks.length - 1);
            self.line.setPoints([0, lineY], [canvas.width, lineY]);

        }

        var self = this;
        this.name = name;
        this.line = null;
        this.reservations = [];
    },

    Canvas: function(elementName) {
        this.getDateOffsetXCoordinate = function(offset) {
            return (offset + 1) * self.dayWidth;
        }

        this.positionAndSizeElements = function(object) {
            if (self.width == self.parentElement.clientWidth &&
                self.height == self.parentElement.clientHeight)
                return;

            self.height = BlockPuzzle.TRACK_HEIGHT * self.tracks.length;
            self.width = self.parentElement.clientWidth;
            self.dayWidth = self.width / self.dates.length;

            self.element.style.width = self.width;
            self.element.style.height = self.height;
            self.element.setAttribute("viewBox", "0 0 " + self.width + " " + self.height);

            for (var i = 0; i < self.dates.length; i++) {
                self.dates[i].positionAndSizeElements(canvas, i);
            }

            for (var i = 0; i < self.tracks.length; i++) {
                self.tracks[i].positionAndSizeElements(canvas, i);
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

        this.calculateStartAndEndDates = function(data) {
            self.startDate = null;
            self.endDate = null;

            for (var i = 0; i < self.tracks.length; i++) {
                var reservations = self.tracks[i].reservations;
                for (var j = 0; j < reservations.length; j++) {
                    var reservation = reservations[j];

                    if (self.startDate === null || self.startDate > reservation.startDate) {
                        self.startDate =
                            new Date(reservation.start.getFullYear(), 0, 1, 0, 0, 0, 0);
                    }

                    if (self.endDate === null || self.endDate < reservation.endDate) {
                        self.endDate =
                            new Date(reservation.end.getFullYear(), 11, 31, 0, 0, 0, 0);
                    }
                }
            }

            self.fillDatesArray();
        }

        this.setData = function(data) {
            for (var i = 0; i < data.length; i++) {
                var track = new BlockPuzzle.Track(data[i].name);
                for (var j = 0; j < data[i].reservations.length; j++) {
                    var reservation = data[i].reservations[j];
                    track.addReservation(new BlockPuzzle.Reservation(reservation[0],
                                                                     reservation[1],
                                                                     reservation[2]));
                }
                self.tracks.push(track);
            }

            self.calculateStartAndEndDates();

            self.buildDOM();
            self.positionAndSizeElements();
        }

        this.buildDOM = function() {
            while (self.element.firstChild) {
                self.element.removeChild(self.element.firstChild);
            }

            for (var i = 0; i < self.dates.length; i++) {
                self.dates[i].buildDOM(self.element);
            }

            for (var i = 0; i < self.tracks.length; i++) {
                self.tracks[i].buildDOM(self.element);
            }
        }

        var self = this;
        self.tracks = [];

        self.parentElement = document.getElementById(elementName);
        self.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        self.parentElement.appendChild(this.element);

        window.onresize = function() {
            self.positionAndSizeElements();
        }
    },
}
